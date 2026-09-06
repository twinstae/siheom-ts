import {
  planHangulKeystrokes,
  withSuffix,
  type HangulKeyStroke,
} from "../planHangulKeystrokes/index.js";
import {
  ImeTrace,
  playEventPlan,
  readMaxLength,
  setImeSession,
  takePendingMaxLengthReject,
  type ComposedEventRecord,
} from "../_internal/index.js";
import { consumeImeControlledWriteback } from "../markImeControlledWriteback/index.js";
import { resolveProfile, type HangulComposeMode, type ImeProfile } from "../profiles/index.js";
import {
  composeHangulSafariComposition,
  composeHangulSafariReplacement,
} from "./composeHangulSafari.js";
import { composeHangulContentEditableFirefoxBroken } from "./composeHangulContentEditableFirefoxBroken.js";
import { composeHangulContentEditableFirefoxFixed } from "./composeHangulContentEditableFirefoxFixed.js";
import { composeHangulContentEditableAndroidFirefoxFixed } from "./composeHangulContentEditableAndroidFirefoxFixed.js";
import { composeHangulAndroidChromeSlatePlaceholderBroken } from "./composeHangulAndroidChromeSlatePlaceholderBroken.js";
import { composeHangulAndroidChromeSlatePlainControl } from "./composeHangulAndroidChromeSlatePlainControl.js";
import { composeHangulAndroidFirefoxSlatePlaceholderBroken } from "./composeHangulAndroidFirefoxSlatePlaceholderBroken.js";
import { composeHangulAndroidFirefoxSlatePlaceholderFixed } from "./composeHangulAndroidFirefoxSlatePlaceholderFixed.js";
import { composeHangulAndroidFirefoxSlatePlainControl } from "./composeHangulAndroidFirefoxSlatePlainControl.js";
import {
  composeHangulLinuxChromeSlatePlaceholderFixed,
  composeHangulLinuxChromeSlatePlainControl,
  composeHangulLinuxFirefoxSlatePlaceholderFixed,
  composeHangulLinuxFirefoxSlatePlainControl,
} from "./composeHangulLinuxSlateGolden.js";
import {
  decideStrokeStepOutcome,
  planBoundaryCommitAfterStep,
  planChromeBlurAbortTail,
  planChromeDeferredAbortTail,
  planChromePendingOverflowReject,
  planChromeStrokeHead,
  planChromeStrokeKeyup,
  planEndComposition,
  planIsolatedJamo,
} from "./planStroke.js";
import { playPreeditStep } from "./playPreeditStep.js";
import { settleAfterPreedit } from "./settle.js";

export type { ComposedEventRecord } from "../_internal/index.js";

export type ComposeHangulOptions = {
  /** When true (default), fire compositionend for the final syllable */
  commitFinal?: boolean;
  /**
   * When to yield after each preedit so host code (React setState, focus bounce) can run.
   * - `microtask` (default): focus-steal blur detection
   * - `macrotask`: `setTimeout(0)` — needed for deferred React writeback races
   */
  settle?: "microtask" | "macrotask";
  /**
   * After each macrotask settle, if the host marked a controlled writeback
   * (`markImeControlledWriteback`) or the DOM value no longer matches the planned
   * preedit, abort continuous composition and type remaining jamos in isolation
   * *without* compositionend — matching Linux delayed-update OS captures.
   */
  deferredUpdateRace?: boolean;
  /** OS IME profile (defaults to linux-chrome-ibus-hangul). */
  profile?: string | ImeProfile;
};

type StrokeAbort = "aborted-blur" | "aborted-deferred" | "maxlength-reject" | "ok";

type AlternateComposeContext = {
  element: HTMLInputElement | HTMLTextAreaElement;
  text: string;
  strokes: HangulKeyStroke[];
  suffix: string;
  profile: ImeProfile;
  options: ComposeHangulOptions;
};

type AlternateComposer = (ctx: AlternateComposeContext) => Promise<ComposedEventRecord[]>;

async function playRemainingIsolated(
  trace: ImeTrace,
  remaining: string[],
  suffix: string,
  settle: "microtask" | "macrotask",
  commit: boolean,
  profile: ImeProfile,
) {
  for (const jamo of remaining) {
    const { element } = trace;
    const committed = element.value.slice(0, element.value.length - suffix.length);
    playEventPlan(
      trace,
      planIsolatedJamo(jamo, committed, suffix, profile, commit, {
        valueBefore: element.value,
        maxLength: readMaxLength(element),
      }),
    );
    await settleAfterPreedit(settle);
  }
}

async function playChromePreeditStepsWithAbort(
  trace: ImeTrace,
  stroke: HangulKeyStroke,
  suffix: string,
  blurred: { current: boolean },
  settle: "microtask" | "macrotask",
  deferredUpdateRace: boolean,
  profile: ImeProfile,
): Promise<StrokeAbort | null> {
  const { element } = trace;
  const carets = stroke.valuesAfterSteps.map((value) => value.length - suffix.length);

  for (let i = 0; i < stroke.preeditSteps.length; i++) {
    const preedit = stroke.preeditSteps[i] ?? "";
    const value = stroke.valuesAfterSteps[i] ?? element.value;
    const caret = carets[i] ?? value.length - suffix.length;

    playPreeditStep(trace, preedit, value, caret, suffix, profile);
    await settleAfterPreedit(settle);

    const writeback = deferredUpdateRace && consumeImeControlledWriteback(element);
    const outcome = decideStrokeStepOutcome({
      plannedValue: value,
      domValue: element.value,
      blurred: blurred.current,
      writeback: Boolean(writeback),
    });

    if (outcome === "aborted-deferred") {
      playEventPlan(trace, planChromeDeferredAbortTail(stroke, profile));
      return "aborted-deferred";
    }

    if (outcome === "aborted-blur") {
      blurred.current = false;
      playEventPlan(trace, planChromeBlurAbortTail(stroke, profile, preedit));
      return "aborted-blur";
    }

    playEventPlan(
      trace,
      planBoundaryCommitAfterStep(stroke, value, i, profile.postCompositionEndInput),
    );
  }

  return null;
}

function playPendingMaxLengthRejectIfNeeded(trace: ImeTrace): StrokeAbort | null {
  const { element } = trace;
  const pendingReject = takePendingMaxLengthReject(element);
  if (!pendingReject) return null;
  const limit = readMaxLength(element);
  if (limit !== null && element.value.length > limit) {
    playEventPlan(
      trace,
      planChromePendingOverflowReject(pendingReject.preedit, pendingReject.overflowValue, limit),
    );
  }
  return "maxlength-reject";
}

async function playStrokeRespectingBlur(
  trace: ImeTrace,
  stroke: HangulKeyStroke,
  suffix: string,
  blurred: { current: boolean },
  settle: "microtask" | "macrotask",
  deferredUpdateRace: boolean,
  profile: ImeProfile,
): Promise<StrokeAbort> {
  playEventPlan(trace, planChromeStrokeHead(stroke, profile));

  const abort = await playChromePreeditStepsWithAbort(
    trace,
    stroke,
    suffix,
    blurred,
    settle,
    deferredUpdateRace,
    profile,
  );
  if (abort) return abort;

  playEventPlan(trace, planChromeStrokeKeyup(stroke, profile));
  return playPendingMaxLengthRejectIfNeeded(trace) ?? "ok";
}

const ALTERNATE_COMPOSERS = {
  replacement: ({ element, strokes, suffix, profile, options }) =>
    composeHangulSafariReplacement(element, strokes, suffix, profile, {
      settle: options.settle,
    }),
  "contenteditable-firefox-broken": ({ element, text, options }) =>
    composeHangulContentEditableFirefoxBroken(element, text, {
      commitFinal: options.commitFinal,
    }),
  "contenteditable-firefox-fixed": ({ element, text, profile, options }) =>
    composeHangulContentEditableFirefoxFixed(element, text, {
      commitFinal: options.commitFinal,
      profile,
    }),
  "contenteditable-firefox-af-fixed": ({ element, text }) =>
    composeHangulContentEditableAndroidFirefoxFixed(element, text),
  "android-chrome-slate-placeholder-broken": ({ element, text }) =>
    composeHangulAndroidChromeSlatePlaceholderBroken(element, text),
  "android-chrome-slate-plain-control": ({ element, text }) =>
    composeHangulAndroidChromeSlatePlainControl(element, text),
  "android-firefox-slate-placeholder-broken": ({ element, text }) =>
    composeHangulAndroidFirefoxSlatePlaceholderBroken(element, text),
  "android-firefox-slate-plain-control": ({ element, text }) =>
    composeHangulAndroidFirefoxSlatePlainControl(element, text),
  "android-firefox-slate-placeholder-fixed": ({ element, text }) =>
    composeHangulAndroidFirefoxSlatePlaceholderFixed(element, text),
  "linux-chrome-slate-placeholder-fixed": ({ element, text }) =>
    composeHangulLinuxChromeSlatePlaceholderFixed(element, text),
  "linux-chrome-slate-plain-control": ({ element, text }) =>
    composeHangulLinuxChromeSlatePlainControl(element, text),
  "linux-firefox-slate-placeholder-fixed": ({ element, text }) =>
    composeHangulLinuxFirefoxSlatePlaceholderFixed(element, text),
  "linux-firefox-slate-plain-control": ({ element, text }) =>
    composeHangulLinuxFirefoxSlatePlainControl(element, text),
} as const satisfies Partial<Record<HangulComposeMode, AlternateComposer>>;

function tryDispatchAlternateCompose(
  ctx: AlternateComposeContext,
): Promise<ComposedEventRecord[]> | null {
  const { element, strokes, suffix, profile, options } = ctx;
  if (
    profile.id === "macos-safari-apple" &&
    (options.settle === "macrotask" || readMaxLength(element) !== null)
  ) {
    element.focus();
    return composeHangulSafariComposition(element, strokes, suffix, profile, {
      commitFinal: options.commitFinal,
      settle: options.settle,
      deferredUpdateRace: options.deferredUpdateRace,
    });
  }

  const composer =
    ALTERNATE_COMPOSERS[profile.hangulComposeMode as keyof typeof ALTERNATE_COMPOSERS];
  if (!composer) return null;
  element.focus();
  return composer(ctx);
}

function finishChromeComposition(
  trace: ImeTrace,
  strokesWithSuffix: HangulKeyStroke[],
  suffix: string,
  commitFinal: boolean,
  profile: ImeProfile,
): void {
  if (strokesWithSuffix.length === 0) return;
  const last = strokesWithSuffix[strokesWithSuffix.length - 1];
  const finalPreedit = last?.preeditSteps[last.preeditSteps.length - 1] ?? "";
  const committed = trace.element.value.slice(
    0,
    trace.element.value.length - suffix.length - finalPreedit.length,
  );

  if (commitFinal) {
    playEventPlan(
      trace,
      planEndComposition(finalPreedit, {
        postCompositionEndInput: profile.postCompositionEndInput,
        confirmPulse: profile.postCompositionEndInput,
        valueBefore: trace.element.value,
        maxLength: readMaxLength(trace.element),
      }),
    );
    return;
  }

  setImeSession(trace.element, {
    composing: true,
    committed,
    preedit: finalPreedit,
    suffix,
  });
}

async function runChromeCompositionSession(
  trace: ImeTrace,
  strokesWithSuffix: HangulKeyStroke[],
  suffix: string,
  settle: "microtask" | "macrotask",
  deferredUpdateRace: boolean,
  commitFinal: boolean,
  profile: ImeProfile,
): Promise<ComposedEventRecord[]> {
  const blurred = { current: false };
  const onBlur = () => {
    blurred.current = true;
  };
  trace.element.addEventListener("blur", onBlur);
  trace.element.focus();

  try {
    for (let index = 0; index < strokesWithSuffix.length; index++) {
      const stroke = strokesWithSuffix[index];
      if (!stroke) continue;

      const result = await playStrokeRespectingBlur(
        trace,
        stroke,
        suffix,
        blurred,
        settle,
        deferredUpdateRace,
        profile,
      );

      if (result === "aborted-blur" || result === "aborted-deferred") {
        const remaining = strokesWithSuffix.slice(index + 1).map((s) => s.jamo);
        await playRemainingIsolated(
          trace,
          remaining,
          suffix,
          settle,
          result === "aborted-blur",
          profile,
        );
        return trace.records;
      }

      if (result === "maxlength-reject") return trace.records;
    }

    finishChromeComposition(trace, strokesWithSuffix, suffix, commitFinal, profile);
    return trace.records;
  } finally {
    trace.element.removeEventListener("blur", onBlur);
  }
}

/**
 * Type Hangul `text` into an input by dispatching composition-faithful events.
 * If the field blurs mid-composition (focus-steal), remaining jamos are typed as
 * isolated compositions — matching OS 풀어쓰기 (e.g. 김태희 → ㄱㅣㅁㅌㅐㅎㅡㅣ).
 * Deferred controlled writeback aborts similarly but without compositionend events.
 */
export async function composeHangul(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  options: ComposeHangulOptions = {},
): Promise<ComposedEventRecord[]> {
  const {
    commitFinal = true,
    settle = "microtask",
    deferredUpdateRace = false,
    profile: profileOpt,
  } = options;
  const profile = resolveProfile(profileOpt);
  const selectionStart = element.selectionStart ?? element.value.length;
  const selectionEnd = element.selectionEnd ?? element.value.length;
  const prefix = element.value.slice(0, selectionStart);
  const suffix = element.value.slice(selectionEnd);
  const strokes = planHangulKeystrokes(text, {
    prefix,
    compositionBoundary: profile.hangulCompositionBoundary,
    hangulKeyboard: profile.hangulKeyboard,
  });

  const alternate = tryDispatchAlternateCompose({
    element,
    text,
    strokes,
    suffix,
    profile,
    options: { commitFinal, settle, deferredUpdateRace, profile },
  });
  if (alternate) return alternate;

  return runChromeCompositionSession(
    new ImeTrace(element),
    withSuffix(strokes, suffix),
    suffix,
    settle,
    deferredUpdateRace,
    commitFinal,
    profile,
  );
}
