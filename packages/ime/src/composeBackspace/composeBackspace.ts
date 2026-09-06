import type { ComposedEventRecord } from "../_internal/index.js";
import { getImeSession, ImeTrace, playEventPlan, readMaxLength } from "../_internal/index.js";
import { resolveProfile, type ImeProfile } from "../profiles/index.js";
import { planBackspace } from "./planBackspace.js";

/**
 * Hangul IME Backspace: decompose preedit while composing; otherwise deleteContentBackward.
 */
export async function composeBackspace(
  element: HTMLInputElement | HTMLTextAreaElement,
  profile?: string | ImeProfile,
): Promise<ComposedEventRecord[]> {
  const resolved = resolveProfile(profile);
  const trace = new ImeTrace(element);
  const session = getImeSession(element);

  playEventPlan(
    trace,
    planBackspace({
      composing: Boolean(session?.composing),
      session,
      value: element.value,
      selectionStart: element.selectionStart ?? element.value.length,
      selectionEnd: element.selectionEnd ?? element.value.length,
      valueBefore: element.value,
      maxLength: readMaxLength(element),
      hangulKeyboard: resolved.hangulKeyboard,
      postCompositionEndInput: resolved.postCompositionEndInput,
    }),
  );

  return trace.records;
}
