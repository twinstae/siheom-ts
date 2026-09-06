import type { HangulKeyStroke } from "../planHangulKeystrokes/index.js";
import type { ImeProfile } from "../profiles/index.js";
import type { EventPlanStep } from "../_internal/eventPlan.js";
import { hangulKeydownFields, hangulKeyupFields } from "../_internal/hangulKeyEvent.js";
import { keyForJamo } from "../_internal/jamoKeyMap.js";
import { planPostCompositionEndInput, planPreedit } from "../_internal/planPreedit.js";
import {
  planChromeCompositionOverflow,
  planSafariCompositionOverflow,
  planSafariReplacementOverflow,
} from "../_internal/planMaxLength.js";
import { planSafariSyllableCommitCore } from "../_internal/planSafari.js";

export type StrokeStepOutcome = "ok" | "aborted-blur" | "aborted-deferred";

export function decideStrokeStepOutcome(facts: {
  plannedValue: string;
  domValue: string;
  blurred: boolean;
  writeback: boolean;
}): StrokeStepOutcome {
  if (facts.writeback || facts.domValue !== facts.plannedValue) {
    return "aborted-deferred";
  }
  if (facts.blurred) {
    return "aborted-blur";
  }
  return "ok";
}

export function decideSafariOverflow(facts: {
  maxLength: number | null;
  plannedValue: string;
  domValue: string;
}): { hostClamped: boolean; clamped: string } | null {
  if (facts.maxLength === null || facts.plannedValue.length <= facts.maxLength) {
    return null;
  }
  const clamped = facts.plannedValue.slice(0, facts.maxLength);
  return { hostClamped: facts.domValue === clamped, clamped };
}

function sessionForPreedit(
  preedit: string,
  value: string,
  caret: number,
  suffix: string,
): EventPlanStep {
  const committedLen = caret - preedit.length;
  return {
    kind: "setSession",
    session: {
      composing: true,
      committed: value.slice(0, committedLen),
      preedit,
      suffix,
    },
  };
}

export function planChromeStrokeHead(
  stroke: HangulKeyStroke,
  profile: ImeProfile,
): EventPlanStep[] {
  const steps: EventPlanStep[] = [];
  if (stroke.shiftLeadIn) {
    steps.push(
      {
        kind: "keydown",
        fields: {
          key: "Process",
          code: "ShiftRight",
          keyCode: 229,
          isComposing: true,
        },
      },
      {
        kind: "keydown",
        fields: {
          key: "Shift",
          code: "ShiftRight",
          keyCode: 16,
          isComposing: true,
        },
      },
    );
  }
  steps.push({
    kind: "keydown",
    fields: {
      ...hangulKeydownFields(profile, stroke),
      isComposing: stroke.keydownIsComposing,
    },
  });
  if (stroke.compositionStart) {
    steps.push({ kind: "compositionstart" });
  }
  return steps;
}

export function planChromePreeditStep(
  preedit: string,
  value: string,
  caret: number,
  suffix: string,
  facts: { valueBefore: string; maxLength: number | null },
  options: { omitCompositionUpdate?: boolean } = {},
): EventPlanStep[] {
  return [
    sessionForPreedit(preedit, value, caret, suffix),
    ...planPreedit(preedit, value, caret, facts, options),
  ];
}

export function planBoundaryCommitAfterStep(
  stroke: HangulKeyStroke,
  value: string,
  stepIndex: number,
  postCompositionEndInput = false,
): EventPlanStep[] {
  if (stepIndex !== 0 || stroke.commitAfterFirstStep === undefined) return [];
  const data = stroke.commitAfterFirstStep;
  return [
    { kind: "compositionend", data, value },
    ...(postCompositionEndInput ? planPostCompositionEndInput(data) : []),
    { kind: "compositionstart" },
  ];
}

export function planChromeDeferredAbortTail(
  stroke: HangulKeyStroke,
  profile: ImeProfile,
): EventPlanStep[] {
  return [
    { kind: "clearSession" },
    {
      kind: "keyup",
      fields: { ...hangulKeyupFields(profile, stroke, false) },
    },
  ];
}

export function planChromeBlurAbortTail(
  stroke: HangulKeyStroke,
  profile: ImeProfile,
  preedit: string,
): EventPlanStep[] {
  return [
    { kind: "compositionend", data: preedit },
    { kind: "clearSession" },
    {
      kind: "keyup",
      fields: { ...hangulKeyupFields(profile, stroke, false) },
    },
  ];
}

export function planChromeStrokeKeyup(
  stroke: HangulKeyStroke,
  profile: ImeProfile,
): EventPlanStep[] {
  return [
    {
      kind: "keyup",
      fields: { ...hangulKeyupFields(profile, stroke, true) },
    },
  ];
}

export function planChromePendingOverflowReject(
  preedit: string,
  overflowValue: string,
  maxLength: number,
): EventPlanStep[] {
  return planChromeCompositionOverflow(preedit, overflowValue, maxLength);
}

export function planIsolatedJamo(
  jamo: string,
  committed: string,
  suffix: string,
  profile: ImeProfile,
  commit: boolean,
  facts: { valueBefore: string; maxLength: number | null },
): EventPlanStep[] {
  const meta = keyForJamo(jamo);
  const stroke = { jamo, code: meta.code, key: meta.key };
  const value = committed + jamo + suffix;
  const caret = committed.length + jamo.length;

  const steps: EventPlanStep[] = [
    {
      kind: "keydown",
      fields: {
        ...hangulKeydownFields(profile, stroke),
        isComposing: false,
      },
    },
    { kind: "compositionstart" },
    {
      kind: "setSession",
      session: { composing: true, committed, preedit: jamo, suffix },
    },
    ...planPreedit(jamo, value, caret, facts),
  ];

  if (commit) {
    steps.push({ kind: "compositionend", data: jamo }, { kind: "clearSession" });
  } else {
    steps.push({ kind: "clearSession" });
  }

  steps.push({
    kind: "keyup",
    fields: { ...hangulKeyupFields(profile, stroke, false) },
  });

  return steps;
}

export function planEndComposition(
  data: string,
  options: {
    postCompositionEndInput?: boolean;
    confirmPulse?: boolean;
    valueBefore?: string;
    maxLength?: number | null;
  } = {},
): EventPlanStep[] {
  const valueBefore = options.valueBefore ?? "";
  const pulse =
    options.confirmPulse && options.postCompositionEndInput
      ? planPreedit(
          data,
          valueBefore,
          valueBefore.length,
          {
            valueBefore,
            maxLength: options.maxLength ?? null,
          },
          { omitCompositionUpdate: true },
        )
      : [];

  return [
    ...pulse,
    { kind: "compositionend", data },
    ...(options.postCompositionEndInput ? planPostCompositionEndInput(data) : []),
    { kind: "clearSession" },
  ];
}

/** Safari: compositionstart (optional) then per-step handled by shell. */
export function planSafariStrokeCompositionStart(stroke: HangulKeyStroke): EventPlanStep[] {
  return stroke.compositionStart ? [{ kind: "compositionstart" }] : [];
}

export function planSafariOverflowReject(
  stroke: HangulKeyStroke,
  profile: ImeProfile,
  preedit: string,
  overflowValue: string,
  maxLength: number,
  hostClamped: boolean,
  clamped: string,
  facts: { valueBefore: string; maxLength: number | null },
): EventPlanStep[] {
  const steps: EventPlanStep[] = [
    {
      kind: "keydown",
      fields: {
        ...hangulKeydownFields(profile, stroke),
        isComposing: !hostClamped,
      },
    },
    {
      kind: "keyup",
      fields: { ...hangulKeyupFields(profile, stroke, !hostClamped) },
    },
  ];

  if (hostClamped) {
    steps.push(
      { kind: "compositionstart" },
      ...planPreedit(preedit, clamped, clamped.length, facts),
      ...planSafariReplacementOverflow(clamped),
    );
  } else {
    steps.push(...planSafariCompositionOverflow(preedit, overflowValue, maxLength));
  }

  steps.push({ kind: "clearSession" });
  return steps;
}

export function planSafariBoundaryCommit(
  stroke: HangulKeyStroke,
  committedValue: string,
  stepIndex: number,
): EventPlanStep[] {
  if (stepIndex !== 0 || stroke.commitAfterFirstStep === undefined) return [];
  return [
    ...planSafariSyllableCommitCore(stroke.commitAfterFirstStep, committedValue),
    { kind: "compositionstart" },
  ];
}

export function planSafariStrokeKeys(
  stroke: HangulKeyStroke,
  profile: ImeProfile,
): EventPlanStep[] {
  return [
    {
      kind: "keydown",
      fields: {
        ...hangulKeydownFields(profile, stroke),
        isComposing: true,
      },
    },
    {
      kind: "keyup",
      fields: { ...hangulKeyupFields(profile, stroke, true) },
    },
  ];
}

export function planSafariDeferredBrokenStep(
  stroke: HangulKeyStroke,
  profile: ImeProfile,
  preedit: string,
  value: string,
  caret: number,
  facts: { valueBefore: string; maxLength: number | null },
): EventPlanStep[] {
  return [
    ...planPreedit(preedit, value, caret, facts),
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
  ];
}
