import type { ComposedEventRecord } from "../_internal/index.js";
import { getImeSession, ImeTrace, playEventPlan, readMaxLength } from "../_internal/index.js";
import { resolveProfile, type ImeProfile } from "../profiles/index.js";
import { planArrowLeft } from "./planArrowLeft.js";

/**
 * ArrowLeft: if composing, confirm+end composition first (ibus-hangul style), then move caret.
 * Windows Chrome MS/Ngs emit Process+ArrowLeft 229 before confirm.
 */
export async function composeArrowLeft(
  element: HTMLInputElement | HTMLTextAreaElement,
  profile?: string | ImeProfile,
): Promise<ComposedEventRecord[]> {
  const resolved = resolveProfile(profile);
  const trace = new ImeTrace(element);
  const session = getImeSession(element);

  playEventPlan(
    trace,
    planArrowLeft({
      composing: Boolean(session?.composing),
      session,
      caret: element.selectionStart ?? 0,
      value: element.value,
      confirmFacts: {
        valueBefore: element.value,
        maxLength: readMaxLength(element),
      },
      enterFacet: resolved.enterDuringComposition,
      postCompositionEndInput: resolved.postCompositionEndInput,
    }),
  );

  return trace.records;
}
