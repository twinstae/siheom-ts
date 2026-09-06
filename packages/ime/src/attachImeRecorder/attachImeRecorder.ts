import type { ComposedEventRecord } from "../_internal/index.js";
import { readEditableText } from "../_internal/editableElement.js";

const IME_EVENT_TYPES = [
  "keydown",
  "keyup",
  "keypress",
  "compositionstart",
  "compositionupdate",
  "compositionend",
  "beforeinput",
  "input",
] as const;

function readKeyboardSnapshotFields(
  event: Event,
): Pick<ComposedEventRecord, "key" | "code" | "keyCode" | "isComposing"> {
  const keyboard = event as KeyboardEvent;
  const input = event as InputEvent;
  return {
    key: "key" in keyboard ? (keyboard.key ?? null) : null,
    code: "code" in keyboard ? (keyboard.code ?? null) : null,
    keyCode: "keyCode" in keyboard ? (keyboard.keyCode ?? null) : null,
    isComposing:
      "isComposing" in keyboard || "isComposing" in input
        ? (keyboard.isComposing ?? input.isComposing ?? null)
        : null,
  };
}

function isCompositionDataEvent(eventType: string): boolean {
  return (
    eventType.startsWith("composition") || eventType === "beforeinput" || eventType === "input"
  );
}

function readInputSnapshotFields(event: Event): Pick<ComposedEventRecord, "inputType" | "data"> {
  const composition = event as CompositionEvent;
  const input = event as InputEvent;
  return {
    inputType: "inputType" in input ? (input.inputType ?? null) : null,
    data: isCompositionDataEvent(event.type)
      ? ((composition.data ?? input.data ?? null) as string | null)
      : null,
  };
}

function snapshotFromDom(element: HTMLElement, event: Event): ComposedEventRecord {
  return {
    type: event.type,
    ...readKeyboardSnapshotFields(event),
    ...readInputSnapshotFields(event),
    value: readEditableText(element),
  };
}

/** Attach listeners that record IME-relevant DOM events (logger-compatible shape). */
export function attachImeRecorder(element: HTMLElement): {
  events: ComposedEventRecord[];
  detach: () => void;
} {
  const events: ComposedEventRecord[] = [];
  const listener = (event: Event) => {
    events.push(snapshotFromDom(element, event));
  };

  for (const type of IME_EVENT_TYPES) {
    element.addEventListener(type, listener);
  }

  return {
    events,
    detach: () => {
      for (const type of IME_EVENT_TYPES) {
        element.removeEventListener(type, listener);
      }
    },
  };
}
