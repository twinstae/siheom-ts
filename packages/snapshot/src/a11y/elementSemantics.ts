/**
 * Centralized passive element semantics for accessibility tree building.
 *
 * isEffectivelyHidden: ported from @testing-library/dom's isSubtreeInaccessible + isInaccessible.
 * @see https://github.com/testing-library/dom-testing-library/blob/e395d5b8ecd4ec95cc02540ddcf16571ecd33e0f/src/helpers.ts
 *
 * isDisabledByHTMLSemantics: ported from @testing-library/user-event@14.6.1 utils/misc/isDisabled.js
 * @see https://github.com/testing-library/user-event/blob/v14.6.1/src/utils/misc/isDisabled.ts
 * Installed version: @testing-library/user-event@14.6.1
 */

export function isEffectivelyHidden(el: Element): boolean {
  const win = el.ownerDocument.defaultView;
  if (win) {
    // visibility is inherited - early exit
    const style = win.getComputedStyle(el);
    if (style.visibility === "hidden") {
      return true;
    }
    if (!style.visibility) {
      for (let current: Element | null = el; current; current = current.parentElement) {
        if (current instanceof HTMLElement && current.style.visibility) {
          return current.style.visibility === "hidden";
        }
      }
    }
  }

  let current: Element | null = el;
  while (current) {
    if ("hidden" in current && current.hidden === true) {
      return true;
    }
    if (current.getAttribute("aria-hidden") === "true") {
      return true;
    }
    if (current instanceof HTMLElement && current.style.display === "none") {
      return true;
    }
    if (win) {
      const style = win.getComputedStyle(current);
      if (style.display === "none") {
        return true;
      }
    }
    current = current.parentElement;
  }

  return false;
}

export function isDisabledByHTMLSemantics(el: Element): boolean {
  if ("disabled" in el && el.disabled === true) {
    return true;
  }

  for (let current: Element | null = el; current; current = current.parentElement) {
    const tag = current.tagName.toLowerCase();
    if (current.matches("button, input, select, textarea, optgroup, option")) {
      if (current.hasAttribute("disabled")) {
        return true;
      }
    } else if (tag === "fieldset") {
      if (current.hasAttribute("disabled")) {
        // First legend child of a disabled fieldset is NOT disabled.
        const firstLegend = current.querySelector(":scope > legend");
        if (!firstLegend || !firstLegend.contains(el)) {
          return true;
        }
      }
    } else if (tag.includes("-")) {
      // Form-associated custom element: check static formAssociated on the constructor.
      if (
        "formAssociated" in current.constructor &&
        current.constructor.formAssociated === true &&
        current.hasAttribute("disabled")
      ) {
        return true;
      }
    }
  }
  return false;
}
