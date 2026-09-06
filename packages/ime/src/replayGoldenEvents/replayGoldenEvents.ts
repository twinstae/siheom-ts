import type { ComposedEventRecord } from "../_internal/types.js";
import { ContentEditableImeTrace } from "../_internal/contentEditableImeTrace.js";
import { setInputValue } from "../_internal/events.js";
import type { KeyEventFields } from "../_internal/events.js";
import type { ImeTraceEmitter, InputEventFields } from "../_internal/imeTrace.js";
import { ImeTrace } from "../_internal/imeTrace.js";
import { isEditable } from "../withPresentElement/index.js";
import { settleAfterPreedit } from "../composeHangul/settle.js";
import {
  applyGoldenDomWriteback,
  stripGoldenText,
  type GoldenWritebackMode,
} from "./goldenDomWriteback.js";

function stripZwsp(text: string): string {
  return stripGoldenText(text);
}

function toKeyFields(event: ComposedEventRecord): KeyEventFields {
  return {
    key: event.key ?? "",
    code: event.code ?? "",
    keyCode: event.keyCode ?? 0,
    isComposing: event.isComposing ?? false,
    ...(event.value !== undefined && event.value !== null ? { recordValue: event.value } : {}),
  };
}

function toInputFields(event: ComposedEventRecord): InputEventFields {
  return {
    inputType: event.inputType ?? "",
    data: event.data,
    ...(event.isComposing !== null && event.isComposing !== undefined
      ? { isComposing: event.isComposing }
      : {}),
    ...(event.value !== undefined && event.value !== null ? { value: event.value } : {}),
  };
}

/** @internal Exported for fidelity measurement. */
export function playGoldenEvent(trace: ImeTraceEmitter, event: ComposedEventRecord): void {
  switch (event.type) {
    case "keydown":
      trace.keydown(toKeyFields(event));
      break;
    case "keyup":
      trace.keyup(toKeyFields(event));
      break;
    case "compositionstart":
      trace.compositionStart(event.data ?? "", event.value ?? undefined);
      break;
    case "compositionupdate":
      trace.compositionUpdate(event.data ?? "", event.value ?? undefined);
      break;
    case "compositionend":
      trace.compositionEnd(event.data ?? "", event.value ?? undefined);
      break;
    case "beforeinput":
      trace.beforeInput(toInputFields(event));
      break;
    case "input":
      trace.input(toInputFields(event));
      break;
    default:
      break;
  }
}

export type ReplayGoldenEventsOptions = {
  /** Wait a macrotask between events (contenteditable / Lexical). */
  settle?: "macrotask";
  /** After each event, set DOM to golden `value` (plain CE / input; not Slate-safe). */
  writeback?: GoldenWritebackMode;
};

/** Replay OS-captured golden events verbatim (contenteditable or input). */
export async function replayGoldenEvents(
  element: HTMLElement,
  events: ComposedEventRecord[],
  options: ReplayGoldenEventsOptions = {},
): Promise<ComposedEventRecord[]> {
  const trace = isEditable(element) ? new ImeTrace(element) : new ContentEditableImeTrace(element);
  element.focus();

  for (const event of events) {
    playGoldenEvent(trace, event);
    if (trace instanceof ImeTrace && event.type === "input" && event.value != null) {
      const visible = stripZwsp(event.value);
      setInputValue(trace.element, visible, visible.length);
    }
    if (options.settle === "macrotask" && trace instanceof ContentEditableImeTrace) {
      await settleAfterPreedit("macrotask");
    }
    if (options.writeback === "golden" && event.value != null) {
      applyGoldenDomWriteback(element, event.value);
    }
  }

  return trace.records;
}
