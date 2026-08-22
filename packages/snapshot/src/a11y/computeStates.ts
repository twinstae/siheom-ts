import type { A11yStates } from "./types.js";
import { isCheckableRole } from "./ariaRoles.js";
import { isDisabledByHTMLSemantics } from "./elementSemantics.js";
import { fromDefinedEntries, mergeDefinedParts } from "./assignDefined.js";

function checkBooleanAttribute(
  el: Element,
  attr: string,
  isVerbose: boolean,
): boolean | null | undefined {
  const val = el.getAttribute(attr);
  if (val === "true") return true;
  if (val === "false") return false;
  if (isVerbose && el.hasAttribute(attr)) return null;
  return undefined;
}

function checkTriStateAttribute(
  el: Element,
  attr: string,
  isVerbose: boolean,
): boolean | "mixed" | null | undefined {
  const val = el.getAttribute(attr);
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "mixed") return "mixed";
  if (isVerbose && el.hasAttribute(attr)) return null;
  return undefined;
}

export function computeAriaHidden(el: Element, isVerbose = false): boolean | null | undefined {
  return checkBooleanAttribute(el, "aria-hidden", isVerbose);
}

export function computeAriaDisabled(el: Element, isVerbose = false): boolean | null | undefined {
  // Check native HTML disabled (including inheritance from fieldset/custom elements).
  if (isDisabledByHTMLSemantics(el)) {
    return true;
  }
  return checkBooleanAttribute(el, "aria-disabled", isVerbose);
}

export function computeAriaModal(el: Element, isVerbose = false): boolean | null | undefined {
  return checkBooleanAttribute(el, "aria-modal", isVerbose);
}

export function computeAriaExpanded(el: Element, isVerbose = false): boolean | null | undefined {
  return checkBooleanAttribute(el, "aria-expanded", isVerbose);
}

export function computeAriaPressed(
  el: Element,
  isVerbose = false,
): boolean | "mixed" | null | undefined {
  return checkTriStateAttribute(el, "aria-pressed", isVerbose);
}

export function computeAriaChecked(
  el: Element,
  isVerbose = false,
): boolean | "mixed" | null | undefined {
  if ("indeterminate" in el && (el as HTMLInputElement).indeterminate) {
    return "mixed";
  }
  if ("checked" in el) {
    return (el as HTMLInputElement).checked;
  }
  return checkTriStateAttribute(el, "aria-checked", isVerbose);
}

export function computeAriaSelected(el: Element, isVerbose = false): boolean | null | undefined {
  if (el.tagName === "OPTION") {
    return (el as HTMLOptionElement).selected;
  }
  return checkBooleanAttribute(el, "aria-selected", isVerbose);
}

export function computeAriaCurrent(
  el: Element,
  isVerbose = false,
): string | boolean | null | undefined {
  const value = el.getAttribute("aria-current");
  if (value === "true") return true;
  if (value === "false") return false;
  if (value) return value;
  if (isVerbose && el.hasAttribute("aria-current")) return null;
  return undefined;
}

export function computeAriaInvalid(
  el: Element,
  isVerbose = false,
): boolean | "grammar" | "spelling" | null | undefined {
  const val = el.getAttribute("aria-invalid");
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "grammar") return "grammar";
  if (val === "spelling") return "spelling";
  if (isVerbose && el.hasAttribute("aria-invalid")) return null;
  return undefined;
}

export function computeAriaRequired(el: Element, isVerbose = false): boolean | null | undefined {
  if ("required" in el && (el as HTMLInputElement).required) {
    return true;
  }
  return checkBooleanAttribute(el, "aria-required", isVerbose);
}

export function computeAriaReadonly(el: Element, isVerbose = false): boolean | null | undefined {
  if ("readOnly" in el && (el as HTMLInputElement).readOnly) {
    return true;
  }
  return checkBooleanAttribute(el, "aria-readonly", isVerbose);
}

export function computeStates(
  el: Element,
  role: string,
  isVerbose = false,
): A11yStates | undefined {
  return mergeDefinedParts(
    collectAlwaysStates(el, isVerbose),
    collectCheckedState(el, role, isVerbose),
  );
}

function collectAlwaysStates(el: Element, isVerbose: boolean): A11yStates {
  return fromDefinedEntries([
    ["hidden", computeAriaHidden(el, isVerbose)],
    ["disabled", computeAriaDisabled(el, isVerbose)],
    ["modal", computeAriaModal(el, isVerbose)],
    ["expanded", computeAriaExpanded(el, isVerbose)],
    ["pressed", computeAriaPressed(el, isVerbose)],
    ["selected", computeAriaSelected(el, isVerbose)],
    ["current", computeAriaCurrent(el, isVerbose)],
    ["invalid", computeAriaInvalid(el, isVerbose)],
    ["required", computeAriaRequired(el, isVerbose)],
    ["readonly", computeAriaReadonly(el, isVerbose)],
  ]);
}

function collectCheckedState(el: Element, role: string, isVerbose: boolean): A11yStates {
  if (!isCheckableRole(role)) return {};
  return fromDefinedEntries([["checked", computeAriaChecked(el, isVerbose)]]);
}
