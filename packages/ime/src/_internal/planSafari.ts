import type { EventPlanStep } from "./eventPlan.js";
import { planPreedit } from "./planPreedit.js";

export type PlanSafariInsertOptions = {
  clearedCaret?: number;
  finalCaret?: number;
};

/** Pure: deleteCompositionText + insertFromComposition (no compositionend). */
export function planSafariInsertFromComposition(
  syllable: string,
  committedValue: string,
  options: PlanSafariInsertOptions = {},
): EventPlanStep[] {
  const cleared = committedValue.slice(0, committedValue.length - syllable.length);
  const clearedCaret = options.clearedCaret ?? cleared.length;
  const finalCaret = options.finalCaret ?? committedValue.length;

  return [
    {
      kind: "beforeinput",
      fields: {
        inputType: "deleteCompositionText",
        data: null,
        isComposing: true,
        value: committedValue,
      },
    },
    { kind: "setValue", value: cleared, caret: clearedCaret },
    {
      kind: "input",
      fields: {
        inputType: "deleteCompositionText",
        data: null,
        isComposing: true,
        value: cleared,
      },
    },
    {
      kind: "beforeinput",
      fields: {
        inputType: "insertFromComposition",
        data: syllable,
        isComposing: true,
        value: cleared,
      },
    },
    { kind: "setValue", value: committedValue, caret: finalCaret },
    {
      kind: "input",
      fields: {
        inputType: "insertFromComposition",
        data: syllable,
        isComposing: true,
        value: committedValue,
      },
    },
  ];
}

/** Pure: insert + compositionend. */
export function planSafariSyllableCommitCore(
  syllable: string,
  committedValue: string,
): EventPlanStep[] {
  return [
    ...planSafariInsertFromComposition(syllable, committedValue),
    { kind: "compositionend", data: syllable, value: committedValue },
  ];
}

/** Pure: preedit echo then Safari syllable commit. */
export function planSafariSyllableCommit(
  syllable: string,
  committedValue: string,
  facts: { valueBefore: string; maxLength: number | null },
): EventPlanStep[] {
  return [
    ...planPreedit(syllable, committedValue, committedValue.length, facts),
    ...planSafariSyllableCommitCore(syllable, committedValue),
  ];
}

export function planRestartSafariComposition(): EventPlanStep[] {
  return [{ kind: "compositionstart" }];
}
