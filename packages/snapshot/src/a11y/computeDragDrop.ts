import type { A11yDragDrop } from "./types.js";

export function computeGrabbed(el: Element, isVerbose = false): boolean | null | undefined {
  const val = el.getAttribute("aria-grabbed");
  if (val === "true") return true;
  if (val === "false") return false;
  if (isVerbose && el.hasAttribute("aria-grabbed")) return null;
  return undefined;
}

export function computeDropeffect(el: Element, isVerbose = false): string | null | undefined {
  const val = el.getAttribute("aria-dropeffect");
  if (val) return val;
  if (isVerbose && el.hasAttribute("aria-dropeffect")) return null;
  return undefined;
}

export function computeDragDrop(el: Element, isVerbose = false): A11yDragDrop | undefined {
  const dragDrop: A11yDragDrop = {};
  let hasAny = false;

  const grabbed = computeGrabbed(el, isVerbose);
  if (grabbed !== undefined) {
    dragDrop.grabbed = grabbed;
    hasAny = true;
  }

  const dropeffect = computeDropeffect(el, isVerbose);
  if (dropeffect !== undefined) {
    dragDrop.dropeffect = dropeffect;
    hasAny = true;
  }

  return hasAny ? dragDrop : undefined;
}
