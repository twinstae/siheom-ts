import type { ImeComposeSession } from "./session.js";
import type { EventPlanStep } from "./eventPlan.js";
import { planPostCompositionEndInput, planPreedit } from "./planPreedit.js";

export type PlanConfirmFacts = {
  valueBefore: string;
  maxLength: number | null;
};

/** Pure: preedit pulse + compositionend + clear session + settle caret. */
export function planConfirmAndEndComposition(
  session: ImeComposeSession,
  facts: PlanConfirmFacts,
  options: { pulse?: boolean; postCompositionEndInput?: boolean } = {},
): EventPlanStep[] {
  if (!session.composing) return [];

  const caret = session.committed.length + session.preedit.length;
  const value = session.committed + session.preedit + session.suffix;
  const pulse = options.pulse !== false;
  const omitCompositionUpdate =
    Boolean(options.postCompositionEndInput) && facts.valueBefore === value;

  return [
    ...(pulse ? planPreedit(session.preedit, value, caret, facts, { omitCompositionUpdate }) : []),
    { kind: "compositionend", data: session.preedit, value },
    ...(options.postCompositionEndInput ? planPostCompositionEndInput(session.preedit) : []),
    { kind: "clearSession" },
    { kind: "setValue", value, caret },
  ];
}
