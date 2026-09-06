import type { EnterDuringCompositionFacet } from "../profiles/index.js";
import type { EventPlanStep } from "../_internal/eventPlan.js";
import type { ImeComposeSession } from "../_internal/session.js";
import {
  planConfirmAndEndComposition,
  type PlanConfirmFacts,
} from "../_internal/planConfirmComposition.js";

export type PlanEnterInput = {
  composing: boolean;
  facet: EnterDuringCompositionFacet;
  session?: ImeComposeSession;
  confirmFacts: PlanConfirmFacts;
  /** Desktop keyboards use "Enter"; Android virtual keyboard captures use "". */
  enterKeyCode?: string;
  /** Linux ibus pulses preedit before compositionend; Android Enter skips the pulse. */
  confirmPulse?: boolean;
  /** Windows Firefox: insertCompositionText input after compositionend. */
  postCompositionEndInput?: boolean;
};

function plainEnterKeydown(code: string): EventPlanStep {
  return {
    kind: "keydown",
    fields: { key: "Enter", code, keyCode: 13, isComposing: false },
  };
}

function plainEnterKeyup(code: string): EventPlanStep {
  return {
    kind: "keyup",
    fields: { key: "Enter", code, keyCode: 13, isComposing: false },
  };
}

/** Pure: Enter ordering by profile facet (and plain Enter when not composing). */
export function planEnter(input: PlanEnterInput): EventPlanStep[] {
  const enterCode = input.enterKeyCode ?? "Enter";
  const enterDown = plainEnterKeydown(enterCode);
  const enterUp = plainEnterKeyup(enterCode);

  if (!input.composing || !input.session) {
    return [enterDown, enterUp];
  }

  const confirm = planConfirmAndEndComposition(input.session, input.confirmFacts, {
    pulse: input.confirmPulse,
    postCompositionEndInput: input.postCompositionEndInput,
  });

  switch (input.facet) {
    case "webkit":
      return [...confirm, enterDown, enterUp];
    case "chromium":
    case "chromium-duplicate":
      return [
        {
          kind: "keydown",
          fields: { key: "Process", code: "Enter", keyCode: 229, isComposing: true },
        },
        ...confirm,
        ...(input.facet === "chromium-duplicate" ? [enterDown] : []),
        enterUp,
      ];
    case "chromium-apple":
      return [
        {
          kind: "keydown",
          fields: { key: "Enter", code: "Enter", keyCode: 229, isComposing: true },
        },
        ...confirm,
        enterUp,
        enterDown,
        enterUp,
      ];
  }
}
