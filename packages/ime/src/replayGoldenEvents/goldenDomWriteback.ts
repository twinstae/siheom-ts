import { setInputValue } from "../_internal/events.js";
import { isEditable } from "../withPresentElement/index.js";

export type GoldenWritebackMode = "none" | "golden";

export function stripGoldenText(text: string): string {
  return text.replace(/\u200b/g, "");
}

/** Force DOM to captured golden `value` (Experiment 1 — upper-bound emulation). */
export function applyGoldenDomWriteback(element: HTMLElement, goldenValue: string): void {
  const visible = stripGoldenText(goldenValue);
  if (isEditable(element)) {
    setInputValue(element, visible, visible.length);
    return;
  }
  element.textContent = visible;
}
