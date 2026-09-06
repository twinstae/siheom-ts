import type { HangulKeyStroke } from "../planHangulKeystrokes/index.js";
import {
  clearImeSession,
  hangulKeydownFields,
  hangulKeyupFields,
  ImeTrace,
  playEventPlan,
  planReplacementText,
  planRestartSafariComposition,
  planSafariSyllableCommit,
  readMaxLength,
  replacementInputType,
  type ComposedEventRecord,
} from "../_internal/index.js";
import { consumeImeControlledWriteback } from "../markImeControlledWriteback/index.js";
import type { ImeProfile } from "../profiles/index.js";

import type { ComposeHangulOptions } from "./composeHangul.js";
import { playPreeditStep } from "./playPreeditStep.js";
import {
  decideSafariOverflow,
  decideStrokeStepOutcome,
  planSafariBoundaryCommit,
  planSafariDeferredBrokenStep,
  planSafariOverflowReject,
  planSafariStrokeCompositionStart,
  planSafariStrokeKeys,
} from "./planStroke.js";
import { settleAfterPreedit } from "./settle.js";

function shouldConfirmAfterStroke(strokes: HangulKeyStroke[], index: number): boolean {
  const next = strokes[index + 1];
  if (!next) return true;
  return next.compositionStart;
}

function playSafariReplacementPreeditStep(
  trace: ImeTrace,
  stroke: HangulKeyStroke,
  stepIndex: number,
  suffix: string,
  profile: ImeProfile,
): void {
  const { element } = trace;
  const preedit = stroke.preeditSteps[stepIndex] ?? "";
  const value = stroke.valuesAfterSteps[stepIndex] ?? element.value;
  const caret = value.length - suffix.length;
  const previousValue = element.value;

  playEventPlan(
    trace,
    planReplacementText(
      preedit,
      value,
      replacementInputType(previousValue, value, preedit),
      caret,
      previousValue,
    ),
  );

  playEventPlan(trace, [
    {
      kind: "keydown",
      fields: {
        ...hangulKeydownFields(profile, stroke),
        isComposing: false,
      },
    },
    {
      kind: "keyup",
      fields: { ...hangulKeyupFields(profile, stroke, false) },
    },
  ]);
}

function confirmSafariReplacementIfNeeded(
  trace: ImeTrace,
  strokes: HangulKeyStroke[],
  strokeIndex: number,
  finalPreedit: string,
): void {
  if (!shouldConfirmAfterStroke(strokes, strokeIndex) || !finalPreedit) return;
  const { element } = trace;
  playEventPlan(
    trace,
    planReplacementText(
      finalPreedit,
      element.value,
      "insertReplacementText",
      element.value.length,
      element.value,
    ),
  );
}

/** macOS Safari Apple: insertText / insertReplacementText + jamo keydown (no composition). */
export async function composeHangulSafariReplacement(
  element: HTMLInputElement | HTMLTextAreaElement,
  strokes: HangulKeyStroke[],
  suffix: string,
  profile: ImeProfile,
  options: Pick<ComposeHangulOptions, "settle">,
): Promise<ComposedEventRecord[]> {
  const { settle = "microtask" } = options;
  const trace = new ImeTrace(element);

  for (let strokeIndex = 0; strokeIndex < strokes.length; strokeIndex++) {
    const stroke = strokes[strokeIndex];
    if (!stroke) continue;

    const finalPreedit = stroke.preeditSteps[stroke.preeditSteps.length - 1] ?? "";
    for (let i = 0; i < stroke.preeditSteps.length; i++) {
      playSafariReplacementPreeditStep(trace, stroke, i, suffix, profile);
      await settleAfterPreedit(settle ?? "microtask");
    }
    confirmSafariReplacementIfNeeded(trace, strokes, strokeIndex, finalPreedit);
  }

  return trace.records;
}

type SafariStrokeResult =
  | { status: "aborted-deferred"; step: number }
  | { status: "maxlength-reject" }
  | { status: "ok" };

function playSafariPreeditStepsWithOverflow(
  trace: ImeTrace,
  stroke: HangulKeyStroke,
  suffix: string,
  profile: ImeProfile,
): SafariStrokeResult | null {
  const { element } = trace;
  const carets = stroke.valuesAfterSteps.map((value) => value.length - suffix.length);
  const limit = readMaxLength(element);

  for (let i = 0; i < stroke.preeditSteps.length; i++) {
    const preedit = stroke.preeditSteps[i] ?? "";
    const value = stroke.valuesAfterSteps[i] ?? element.value;
    const caret = carets[i] ?? value.length - suffix.length;

    playPreeditStep(trace, preedit, value, caret, suffix);

    const overflow = decideSafariOverflow({
      maxLength: limit,
      plannedValue: value,
      domValue: element.value,
    });

    if (overflow) {
      playEventPlan(
        trace,
        planSafariOverflowReject(
          stroke,
          profile,
          preedit,
          value,
          limit!,
          overflow.hostClamped,
          overflow.clamped,
          {
            valueBefore: element.value,
            maxLength: limit,
          },
        ),
      );
      return { status: "maxlength-reject" };
    }

    playEventPlan(trace, planSafariBoundaryCommit(stroke, element.value, i));
  }

  return null;
}

function detectSafariDeferredAbortAfterKeys(
  element: HTMLInputElement | HTMLTextAreaElement,
  stroke: HangulKeyStroke,
  deferredUpdateRace: boolean,
): SafariStrokeResult {
  const lastValue = stroke.valuesAfterSteps[stroke.valuesAfterSteps.length - 1] ?? element.value;
  const writeback = deferredUpdateRace && consumeImeControlledWriteback(element);
  const outcome = decideStrokeStepOutcome({
    plannedValue: lastValue,
    domValue: element.value,
    blurred: false,
    writeback: Boolean(writeback),
  });

  if (outcome === "aborted-deferred") {
    clearImeSession(element);
    return { status: "aborted-deferred", step: stroke.preeditSteps.length - 1 };
  }

  return { status: "ok" };
}

/** macOS Safari Apple composition order: update → input → keydown (fixed delayed-update captures). */
async function playStrokeSafariComposition(
  trace: ImeTrace,
  stroke: HangulKeyStroke,
  suffix: string,
  profile: ImeProfile,
  settle: "microtask" | "macrotask",
  deferredUpdateRace: boolean,
): Promise<SafariStrokeResult> {
  playEventPlan(trace, planSafariStrokeCompositionStart(stroke));

  const overflowReject = playSafariPreeditStepsWithOverflow(trace, stroke, suffix, profile);
  if (overflowReject) return overflowReject;

  playEventPlan(trace, planSafariStrokeKeys(stroke, profile));

  await settleAfterPreedit(settle);
  if (deferredUpdateRace) {
    await settleAfterPreedit(settle);
  }

  return detectSafariDeferredAbortAfterKeys(trace.element, stroke, deferredUpdateRace);
}

function shouldSkipDeferredPreedit(
  element: HTMLInputElement | HTMLTextAreaElement,
  preedit: string,
  step: number,
  firstStep: number,
): boolean {
  return step === firstStep && element.value.endsWith(preedit);
}

async function playDeferredBrokenStroke(
  trace: ImeTrace,
  stroke: HangulKeyStroke,
  firstStep: number,
  suffix: string,
  profile: ImeProfile,
  settle: "microtask" | "macrotask",
): Promise<void> {
  const { element } = trace;
  playEventPlan(trace, planRestartSafariComposition());

  for (let step = firstStep; step < stroke.preeditSteps.length; step++) {
    const preedit = stroke.preeditSteps[step] ?? "";
    if (shouldSkipDeferredPreedit(element, preedit, step, firstStep)) continue;
    const appended = element.value + preedit;
    const value = appended + suffix;
    playEventPlan(
      trace,
      planSafariDeferredBrokenStep(stroke, profile, preedit, value, appended.length, {
        valueBefore: element.value,
        maxLength: readMaxLength(element),
      }),
    );
    await settleAfterPreedit(settle);
  }
}

/** Safari broken deferred-update: append preedit onto stale DOM value (OS capture). */
async function playSafariDeferredBroken(
  trace: ImeTrace,
  strokes: HangulKeyStroke[],
  startIndex: number,
  startStep: number,
  suffix: string,
  profile: ImeProfile,
  settle: "microtask" | "macrotask",
) {
  for (let strokeIndex = startIndex; strokeIndex < strokes.length; strokeIndex++) {
    const stroke = strokes[strokeIndex];
    if (!stroke) continue;
    const firstStep = strokeIndex === startIndex ? startStep : 0;
    await playDeferredBrokenStroke(trace, stroke, firstStep, suffix, profile, settle);
  }
}

function confirmSafariStrokeIfNeeded(
  trace: ImeTrace,
  strokes: HangulKeyStroke[],
  index: number,
  stroke: HangulKeyStroke,
): void {
  const finalPreedit = stroke.preeditSteps[stroke.preeditSteps.length - 1] ?? "";
  const finalValue =
    stroke.valuesAfterSteps[stroke.valuesAfterSteps.length - 1] ?? trace.element.value;
  if (!shouldConfirmAfterStroke(strokes, index) || !finalPreedit) return;

  playEventPlan(
    trace,
    planSafariSyllableCommit(finalPreedit, finalValue, {
      valueBefore: trace.element.value,
      maxLength: readMaxLength(trace.element),
    }),
  );
  if (index < strokes.length - 1) {
    playEventPlan(trace, planRestartSafariComposition());
  }
}

async function runSafariCompositionLoop(
  trace: ImeTrace,
  strokes: HangulKeyStroke[],
  suffix: string,
  profile: ImeProfile,
  settle: "microtask" | "macrotask",
  deferredUpdateRace: boolean,
): Promise<void> {
  for (let index = 0; index < strokes.length; index++) {
    const stroke = strokes[index];
    if (!stroke) continue;

    const result = await playStrokeSafariComposition(
      trace,
      stroke,
      suffix,
      profile,
      settle,
      deferredUpdateRace,
    );

    if (result.status === "aborted-deferred") {
      await playSafariDeferredBroken(trace, strokes, index, result.step, suffix, profile, settle);
      return;
    }

    if (result.status === "maxlength-reject") return;

    confirmSafariStrokeIfNeeded(trace, strokes, index, stroke);
  }
}

export async function composeHangulSafariComposition(
  element: HTMLInputElement | HTMLTextAreaElement,
  strokes: HangulKeyStroke[],
  suffix: string,
  profile: ImeProfile,
  options: Pick<ComposeHangulOptions, "commitFinal" | "settle" | "deferredUpdateRace">,
): Promise<ComposedEventRecord[]> {
  const { settle = "macrotask", deferredUpdateRace = false } = options;
  const trace = new ImeTrace(element);
  await runSafariCompositionLoop(
    trace,
    strokes,
    suffix,
    profile,
    settle ?? "macrotask",
    deferredUpdateRace ?? false,
  );
  return trace.records;
}
