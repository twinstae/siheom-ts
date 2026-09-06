import type { ComposedEventRecord } from "../_internal/index.js";
import { ContentEditableImeTrace } from "../_internal/contentEditableImeTrace.js";
import { readEditableText } from "../_internal/editableElement.js";
import { settleAfterPreedit } from "./settle.js";

export type NativeCompositionStep = {
  index: number;
  phase: "native-paint" | "reconcile";
  value: string;
};

export type NativeCompositionResult = {
  records: ComposedEventRecord[];
  /** DOM text observed at native-paint (browser) and reconcile (Slate) per step. */
  visibleTimeline: NativeCompositionStep[];
  final: string;
};

/**
 * Faithful Android-Firefox composition model for contenteditable editors.
 *
 * The device flicker (`가가나`, `가나가나ㄷ`) is a *native browser* artifact: after the editor
 * commits a syllable (`가`), the OS IME sends a **cumulative** preedit (`가나`) for the next
 * syllable, and native contenteditable paints it *after* the committed text → `가` + `가나` =
 * `가가나`, until the editor reconciles. Golden event replay never shows it (no native paint);
 * dispatching to Slate alone never shows it (Slate applies from `data`). This model performs the
 * native DOM writeback (`committed + preedit`) so the editor sees what the device Slate saw, then
 * dispatches the composition events and lets the editor reconcile.
 *
 * `intents` are the IME's composition intents for the run (from a device capture until a
 * generative Hangul-IME model lands). Each entry drives one native paint + event pulse; `commit`
 * entries fire `compositionend` and become the new committed prefix.
 *
 * See `docs/research/slate-closed-loop-emulator.md`.
 */
export type CompositionIntent =
  | { kind: "start" }
  | { kind: "update"; data: string }
  | { kind: "commit"; data: string };

/**
 * Where the composition begins — the DOM selection at `compositionstart`. The browser paints
 * the composing text into this region; whatever the editor SELECTS here is what gets replaced.
 * A collapsed caret after committed `가` → the preedit is appended (`가가나`); a range that spans
 * `가` (what a single-composition fix would keep) → the preedit replaces it (`가나`). So reading
 * the real selection is what makes the writeback fix-sensitive.
 */
function captureCompositionRange(element: HTMLElement): Range {
  const doc = element.ownerDocument;
  const selection = doc.getSelection();
  if (selection && selection.rangeCount > 0 && element.contains(selection.anchorNode)) {
    return selection.getRangeAt(0).cloneRange();
  }
  // No usable selection (e.g. empty placeholder) → collapse at end of the editor content.
  const range = doc.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  return range;
}

export async function composeHangulAndroidFirefoxSlateNativeComposition(
  element: HTMLElement,
  intents: CompositionIntent[],
): Promise<NativeCompositionResult> {
  const trace = new ContentEditableImeTrace(element);
  element.focus();

  const doc = element.ownerDocument;
  const visibleTimeline: NativeCompositionStep[] = [];
  let stepIndex = 0;
  // The live composition region the "browser" owns; updates replace its contents in place.
  let compositionRange: Range | null = null;

  for (const intent of intents) {
    if (intent.kind === "start") {
      trace.keydown({
        key: "Process",
        code: "",
        keyCode: 229,
        isComposing: readEditableText(element) !== "",
      });
      trace.compositionStart("");
      compositionRange = captureCompositionRange(element);
      continue;
    }

    if (intent.kind === "update") {
      trace.compositionUpdate(intent.data);
      trace.beforeInput({
        inputType: "insertCompositionText",
        data: intent.data,
        isComposing: true,
      });
      // Browser native paint: replace the composition region's contents with the cumulative
      // preedit. The region = wherever the editor's selection was at compositionstart, so a fix
      // that spans the committed syllable makes this a clean replace instead of an append.
      const range: Range = compositionRange ?? captureCompositionRange(element);
      range.deleteContents();
      const node = doc.createTextNode(intent.data);
      range.insertNode(node);
      // Region now spans the freshly painted text; next update replaces it.
      range.selectNodeContents(node);
      compositionRange = range;
      const selection = doc.getSelection();
      if (selection) {
        const caret = doc.createRange();
        caret.setStart(node, node.data.length);
        caret.collapse(true);
        selection.removeAllRanges();
        selection.addRange(caret);
      }
      visibleTimeline.push({
        index: stepIndex,
        phase: "native-paint",
        value: readEditableText(element),
      });
      trace.input({ inputType: "insertCompositionText", data: intent.data, isComposing: true });
      stepIndex++;
      continue;
    }

    // commit — now let Slate reconcile the composition into its model.
    trace.compositionEnd(intent.data);
    await settleAfterPreedit("macrotask");
    visibleTimeline.push({
      index: stepIndex - 1,
      phase: "reconcile",
      value: readEditableText(element),
    });
    compositionRange = null;
  }

  return { records: trace.records, visibleTimeline, final: readEditableText(element) };
}

/** Extract Android composition intents from a device capture's raw events. */
export function compositionIntentsFromEvents(
  events: readonly { type: string; data: string | null }[],
): CompositionIntent[] {
  const intents: CompositionIntent[] = [];
  for (const event of events) {
    if (event.type === "compositionstart") {
      intents.push({ kind: "start" });
    } else if (event.type === "compositionupdate" && event.data) {
      intents.push({ kind: "update", data: event.data });
    } else if (event.type === "compositionend" && event.data) {
      intents.push({ kind: "commit", data: event.data });
    }
  }
  return intents;
}
