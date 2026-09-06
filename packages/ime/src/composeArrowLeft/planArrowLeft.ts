import type { EventPlanStep } from "../_internal/eventPlan.js";
import type { ImeComposeSession } from "../_internal/session.js";
import {
  planConfirmAndEndComposition,
  type PlanConfirmFacts,
} from "../_internal/planConfirmComposition.js";
import type { EnterDuringCompositionFacet } from "../profiles/index.js";

export type PlanArrowLeftInput = {
  composing: boolean;
  session?: ImeComposeSession;
  /** selectionStart before playing (used when not composing). */
  caret: number;
  value: string;
  confirmFacts: PlanConfirmFacts;
  /** Windows Chrome MS/Ngs: Process+ArrowLeft 229 before confirm. */
  enterFacet?: EnterDuringCompositionFacet;
  postCompositionEndInput?: boolean;
};

/** Pure: confirm composition if needed, then ArrowLeft + caret move. */
export function planArrowLeft(input: PlanArrowLeftInput): EventPlanStep[] {
  const steps: EventPlanStep[] = [];

  let caret = input.caret;
  let value = input.value;

  if (input.composing && input.session) {
    if (input.enterFacet === "chromium-duplicate") {
      steps.push({
        kind: "keydown",
        fields: {
          key: "Process",
          code: "ArrowLeft",
          keyCode: 229,
          isComposing: true,
        },
      });
    }
    steps.push(
      ...planConfirmAndEndComposition(input.session, input.confirmFacts, {
        postCompositionEndInput: input.postCompositionEndInput,
      }),
    );
    caret = input.session.committed.length + input.session.preedit.length;
    value = input.session.committed + input.session.preedit + input.session.suffix;
  }

  steps.push({
    kind: "keydown",
    fields: {
      key: "ArrowLeft",
      code: "ArrowLeft",
      keyCode: 37,
      isComposing: false,
    },
  });

  if (caret > 0) {
    steps.push({ kind: "setValue", value, caret: caret - 1 });
  }

  steps.push({
    kind: "keyup",
    fields: {
      key: "ArrowLeft",
      code: "ArrowLeft",
      keyCode: 37,
      isComposing: false,
    },
  });

  return steps;
}
