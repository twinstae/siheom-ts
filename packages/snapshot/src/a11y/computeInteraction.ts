import { isDisabledByHTMLSemantics, isEffectivelyHidden } from "./elementSemantics.js";
import type { A11yInteraction } from "./types.js";

/**
 * Minimal passive port of focus candidates, active-element resolution, and radio pruning from
 * @testing-library/user-event@14.6.1. Installed version: 14.6.1.
 * @see https://github.com/testing-library/user-event/blob/v14.6.1/src/utils/focus/selector.ts
 * @see https://github.com/testing-library/user-event/blob/v14.6.1/src/utils/focus/isFocusable.ts
 * @see https://github.com/testing-library/user-event/blob/v14.6.1/src/utils/focus/getActiveElement.ts
 * @see https://github.com/testing-library/user-event/blob/v14.6.1/src/utils/focus/getTabDestination.ts
 */
const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden" i])',
  "button",
  "select",
  "textarea",
  '[contenteditable]:not([contenteditable="false" i])',
  "a[href]",
  "area[href]",
  "summary",
  "[tabindex]",
].join(", ");

function isFocusable(el: HTMLElement): boolean {
  const hidden =
    el instanceof HTMLAreaElement
      ? el.hidden ||
        el.getAttribute("aria-hidden") === "true" ||
        el.ownerDocument.defaultView?.getComputedStyle(el).visibility === "hidden" ||
        (el.parentElement ? isEffectivelyHidden(el.parentElement) : false)
      : isEffectivelyHidden(el);

  return el.matches(FOCUSABLE_SELECTOR) && !hidden && !isDisabledByHTMLSemantics(el);
}

function getEffectiveTabIndex(el: HTMLElement): number {
  return el.hasAttribute("tabindex") ? el.tabIndex : 0;
}

function getDeepestActiveElement(root: Document | ShadowRoot): Element | null {
  const activeElement = root.activeElement;
  if (!activeElement?.shadowRoot) {
    return activeElement;
  }
  return getDeepestActiveElement(activeElement.shadowRoot) ?? activeElement;
}

function hasCheckedRadioCandidate(el: HTMLElement): boolean {
  if (!(el instanceof HTMLInputElement) || el.type !== "radio" || el.checked || !el.name) {
    return false;
  }

  return Array.from(
    el.ownerDocument.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ).some(
    (candidate) =>
      candidate.name === el.name &&
      candidate.form === el.form &&
      candidate.checked &&
      isFocusable(candidate) &&
      getEffectiveTabIndex(candidate) >= 0,
  );
}

export function computeInteraction(
  el: HTMLElement,
  isVerbose = false,
): A11yInteraction | undefined {
  const focusable = isFocusable(el);
  const tabbable = focusable && getEffectiveTabIndex(el) >= 0 && !hasCheckedRadioCandidate(el);
  const focused = getDeepestActiveElement(el.ownerDocument) === el;
  const keyshortcuts = el.getAttribute("aria-keyshortcuts")?.trim() || undefined;
  const accesskey = el.getAttribute("accesskey")?.trim() || undefined;

  if (!isVerbose && !focusable && !tabbable && !focused && !keyshortcuts && !accesskey) {
    return undefined;
  }

  return {
    focusable,
    tabbable,
    focused,
    ...(keyshortcuts ? { keyshortcuts } : {}),
    ...(accesskey ? { accesskey } : {}),
  };
}
