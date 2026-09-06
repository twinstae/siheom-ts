import type { EventPlanStep } from "../_internal/eventPlan.js";
import type { KeyEventFields } from "../_internal/events.js";
import { planPreedit } from "../_internal/planPreedit.js";

/** Firefox contenteditable: NBSP composition sentinel + trailing ZWSP in OS captures. */
export const FIREFOX_CE_SENTINEL = "\u00a0\u200b";
const ZWSP = "\u200b";

export function withZwsp(text: string): string {
  return `${text}${ZWSP}`;
}

/** Shared preedit pulse; `caret` differs (fixed uses dom length, broken uses preedit length). */
export function planContentEditablePreeditPulse(
  preedit: string,
  valueBefore: string,
  domValue: string,
  applyDom: boolean,
  caret: number,
): EventPlanStep[] {
  if (applyDom) {
    return planPreedit(preedit, domValue, caret, {
      valueBefore,
      maxLength: null,
    });
  }

  const inputData = preedit === "" ? null : preedit;
  return [
    { kind: "compositionupdate", data: preedit, value: valueBefore },
    {
      kind: "beforeinput",
      fields: {
        inputType: "insertCompositionText",
        data: preedit,
        isComposing: true,
        value: valueBefore,
      },
    },
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: inputData,
        isComposing: true,
        value: domValue,
      },
    },
  ];
}

export function stripZwsp(text: string): string {
  return text.replace(/\u200b/g, "");
}

export function contentEditableValueBefore(
  previousVisible: string,
  sessionJustStarted: boolean,
): string {
  if (sessionJustStarted) {
    return previousVisible === ""
      ? FIREFOX_CE_SENTINEL
      : `${previousVisible}${FIREFOX_CE_SENTINEL}`;
  }
  return withZwsp(previousVisible);
}

export function planDuplicateCompositionPulse(
  preedit: string,
  valueBefore: string,
): EventPlanStep[] {
  return [
    {
      kind: "beforeinput",
      fields: {
        inputType: "insertCompositionText",
        data: preedit,
        isComposing: true,
        value: valueBefore,
      },
    },
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: preedit,
        isComposing: true,
      },
    },
  ];
}

export function planFirefoxDeferredEnd(preedit: string, domValue?: string): EventPlanStep[] {
  const visible = withZwsp(stripZwsp(domValue ?? preedit));
  return [
    { kind: "compositionend", data: preedit, value: visible },
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: preedit,
        isComposing: false,
        value: visible,
      },
    },
  ];
}

export function planContentEditableBoundaryCommit(
  committedData: string,
  domValue: string,
): EventPlanStep[] {
  const visible = stripZwsp(domValue);
  return [
    { kind: "compositionend", data: committedData, value: withZwsp(visible) },
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: committedData,
        isComposing: false,
        value: withZwsp(visible),
      },
    },
    { kind: "compositionstart", value: visible },
  ];
}

/** Firefox contenteditable capture: extra Process keydown (code "") before syllable-boundary preedit. */
export function planContentEditableBoundaryKeydown(domValue: string): EventPlanStep {
  const fields: KeyEventFields = {
    key: "Process",
    code: "",
    keyCode: 229,
    isComposing: true,
    recordValue: withZwsp(stripZwsp(domValue)),
  };
  return { kind: "keydown", fields };
}
