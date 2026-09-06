import type { ComposedEventRecord } from "../_internal/index.js";
import { getImeSession, ImeTrace, playEventPlan, readMaxLength } from "../_internal/index.js";
import type { ImeProfile } from "../profiles/index.js";
import { planEnter } from "./planEnter.js";

/** Android virtual keyboard: empty key `code`, compositionend without confirm pulse. */
function enterPresentation(profile: ImeProfile): {
  enterKeyCode: string;
  confirmPulse: boolean;
} {
  const virtualKeyboard = profile.hangulKeyEventKey === "unidentified";
  return {
    enterKeyCode: virtualKeyboard ? "" : "Enter",
    confirmPulse: !virtualKeyboard,
  };
}

/**
 * Enter while composing — order depends on profile facet (webkit vs chromium).
 * When not composing, fires a plain Enter keydown/keyup.
 */
export async function composeEnter(
  element: HTMLInputElement | HTMLTextAreaElement,
  profile: ImeProfile,
): Promise<ComposedEventRecord[]> {
  const trace = new ImeTrace(element);
  const session = getImeSession(element);

  playEventPlan(
    trace,
    planEnter({
      composing: Boolean(session?.composing),
      facet: profile.enterDuringComposition,
      session,
      confirmFacts: {
        valueBefore: element.value,
        maxLength: readMaxLength(element),
      },
      postCompositionEndInput: profile.postCompositionEndInput,
      ...enterPresentation(profile),
    }),
  );

  return trace.records;
}
