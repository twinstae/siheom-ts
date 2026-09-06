import type { EventPlanStep } from "./eventPlan.js";

export type PlanPreeditFacts = {
  valueBefore: string;
  maxLength: number | null;
};

/** Pure: compositionupdate → beforeinput → setValue → input (+ optional maxLength arm). */
export function planPreedit(
  preedit: string,
  value: string,
  caret: number,
  facts: PlanPreeditFacts,
  options: {
    omitCompositionUpdate?: boolean;
    /** Windows Firefox uses "" for empty insertCompositionText; others use null. */
    emptyCompositionData?: null | "";
  } = {},
): EventPlanStep[] {
  const emptyData =
    options.emptyCompositionData === undefined ? null : options.emptyCompositionData;
  const inputData = preedit === "" ? emptyData : preedit;
  const steps: EventPlanStep[] = [
    ...(options.omitCompositionUpdate
      ? []
      : [{ kind: "compositionupdate" as const, data: preedit, value: facts.valueBefore }]),
    {
      kind: "beforeinput",
      fields: {
        inputType: "insertCompositionText",
        data: preedit,
        isComposing: true,
        value: facts.valueBefore,
      },
    },
    { kind: "setValue", value, caret },
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: inputData,
        isComposing: true,
      },
    },
  ];

  if (facts.maxLength !== null && value.length > facts.maxLength) {
    steps.push({
      kind: "markPendingMaxLengthReject",
      preedit,
      overflowValue: value,
    });
  }

  return steps;
}

/** Windows Firefox: insertCompositionText input after compositionend (isComposing: false). */
export function planPostCompositionEndInput(data: string): EventPlanStep[] {
  return [
    {
      kind: "input",
      fields: {
        inputType: "insertCompositionText",
        data: data === "" ? "" : data,
        isComposing: false,
      },
    },
  ];
}
