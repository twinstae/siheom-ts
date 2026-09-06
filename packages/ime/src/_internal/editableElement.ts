import { isEditable } from "../withPresentElement/index.js";

/** Targets that can receive contenteditable-specific composition emulation. */
export function isContentEditableComposeTarget(
  element: HTMLElement,
): element is HTMLInputElement | HTMLTextAreaElement | HTMLElement {
  return isEditable(element) || element.isContentEditable;
}

export function readEditableText(element: HTMLElement): string {
  if (isEditable(element)) {
    return element.value;
  }
  return element.textContent ?? "";
}
