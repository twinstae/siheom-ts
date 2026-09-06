import type { EventPlanStep } from "./eventPlan.js";
import type { ReplacementInputType } from "./replacementInputType.js";

function clampValue(value: string, limit: number): string {
  return value.slice(0, limit);
}

function planOverflowPreeditPulse(preedit: string, overflowValue: string): EventPlanStep[] {
  return [
    { kind: "compositionupdate", data: preedit, value: overflowValue },
    {
      kind: "beforeinput",
      fields: {
        inputType: "insertCompositionText",
        data: preedit,
        isComposing: true,
        value: overflowValue,
      },
    },
  ];
}

/** Pure: Chrome / Linux overflow reject with empty input data then compositionend. */
export function planChromeCompositionOverflow(
  preedit: string,
  overflowValue: string,
  maxLength: number,
): EventPlanStep[] {
  const clamped = clampValue(overflowValue, maxLength);

  return [
    ...planOverflowPreeditPulse(preedit, overflowValue),
    { kind: "setValue", value: clamped, caret: clamped.length },
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: "",
        isComposing: true,
        value: clamped,
      },
    },
    { kind: "compositionend", data: preedit, value: clamped },
    { kind: "clearSession" },
  ];
}

/** Pure: Safari composition overflow reject. */
export function planSafariCompositionOverflow(
  preedit: string,
  overflowValue: string,
  maxLength: number,
): EventPlanStep[] {
  const clamped = clampValue(overflowValue, maxLength);

  return [
    ...planOverflowPreeditPulse(preedit, overflowValue),
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: preedit,
        isComposing: true,
        value: overflowValue,
      },
    },
    {
      kind: "beforeinput",
      fields: {
        inputType: "deleteCompositionText",
        data: null,
        isComposing: true,
        value: overflowValue,
      },
    },
    { kind: "setValue", value: clamped, caret: clamped.length },
    {
      kind: "input",
      fields: {
        inputType: "deleteCompositionText",
        data: null,
        isComposing: true,
        value: clamped,
      },
    },
    {
      kind: "beforeinput",
      fields: {
        inputType: "insertFromComposition",
        data: "",
        isComposing: true,
        value: clamped,
      },
    },
    {
      kind: "input",
      fields: {
        inputType: "insertFromComposition",
        data: "",
        isComposing: true,
        value: clamped,
      },
    },
    { kind: "compositionend", data: preedit, value: clamped },
    { kind: "clearSession" },
  ];
}

/** Pure: Safari replacement overflow with empty insertText. */
export function planSafariReplacementOverflow(value: string): EventPlanStep[] {
  return [
    {
      kind: "beforeinput",
      fields: {
        inputType: "insertText",
        data: "",
        isComposing: false,
        value,
      },
    },
    {
      kind: "input",
      fields: {
        inputType: "insertText",
        data: "",
        isComposing: false,
        value,
      },
    },
  ];
}

/** Pure: beforeinput → setValue → input replacement (no composition). */
export function planReplacementText(
  data: string,
  value: string,
  inputType: ReplacementInputType,
  caret: number,
  valueBefore: string,
): EventPlanStep[] {
  return [
    {
      kind: "beforeinput",
      fields: {
        inputType,
        data,
        isComposing: false,
        value: valueBefore,
      },
    },
    { kind: "setValue", value, caret },
    {
      kind: "input",
      fields: {
        inputType,
        data,
        isComposing: false,
        value,
      },
    },
  ];
}
