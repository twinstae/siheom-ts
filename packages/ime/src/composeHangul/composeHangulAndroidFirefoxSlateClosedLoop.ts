import type { ComposedEventRecord } from "../_internal/index.js";
import { ContentEditableImeTrace } from "../_internal/contentEditableImeTrace.js";
import { readEditableText } from "../_internal/editableElement.js";
import { planHangulKeystrokes } from "../planHangulKeystrokes/index.js";
import { settleAfterPreedit } from "./settle.js";

/**
 * Closed-loop Android-Firefox Hangul emulator for contenteditable editors.
 *
 * Unlike the golden-replay modes, this does not re-fire a recorded event log. It models the
 * OS IME as a state machine that owns a cumulative preedit buffer (`ㄱ`, `가`, `가ㄴ`, …) and
 * dispatches `compositionupdate` + `beforeinput(insertCompositionText)` per stroke, then lets
 * the editor (Slate `androidInputManager`) mediate the DOM mutation — reading the editor DOM
 * between strokes the way a real IME would.
 *
 * See `docs/research/slate-closed-loop-emulator.md`.
 */
export async function composeHangulAndroidFirefoxSlateClosedLoopOnContentEditable(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  const trace = new ContentEditableImeTrace(element);
  element.focus();

  // Android keeps one composition for the whole run → cumulative preedit.
  const strokes = planHangulKeystrokes(text, { compositionBoundary: "run" });

  let started = false;
  let lastPreedit = "";

  for (const stroke of strokes) {
    const preedit = stroke.preeditSteps[stroke.preeditSteps.length - 1] ?? "";

    trace.keydown({
      key: "Process",
      code: "",
      keyCode: 229,
      isComposing: stroke.keydownIsComposing,
    });

    if (!started) {
      trace.compositionStart("");
      started = true;
    }

    trace.compositionUpdate(preedit);
    trace.beforeInput({ inputType: "insertCompositionText", data: preedit, isComposing: true });
    // Let Slate's beforeinput handler schedule + flush its diff onto the DOM.
    await settleAfterPreedit("macrotask");
    trace.input({ inputType: "insertCompositionText", data: preedit, isComposing: true });
    await settleAfterPreedit("macrotask");

    // Closed-loop observation: read what the editor actually mediated this stroke.
    readEditableText(element);
    lastPreedit = preedit;

    trace.keyup({ key: "Process", code: "", keyCode: 229, isComposing: true });
  }

  if (started) {
    trace.compositionEnd(lastPreedit);
    await settleAfterPreedit("macrotask");
  }

  return trace.records;
}

export function composeHangulAndroidFirefoxSlateClosedLoopOn(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  return composeHangulAndroidFirefoxSlateClosedLoopOnContentEditable(element, text);
}
