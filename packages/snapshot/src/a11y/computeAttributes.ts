import type { A11yAttributes } from "./types.js";

const ATTRIBUTE_ALLOWLIST = new Set([
  "role",
  "accesskey",
  "tabindex",
  "hidden",
  "disabled",
  "readonly",
  "required",
  "contenteditable",
  "inert",
]);

function isAllowedAttributeName(name: string): boolean {
  const normalized = name.toLowerCase();

  if (normalized.startsWith("aria-")) {
    return true;
  }

  if (ATTRIBUTE_ALLOWLIST.has(normalized)) {
    return true;
  }

  return false;
}

function shouldIgnoreAttribute(name: string): boolean {
  const normalized = name.toLowerCase();

  if (normalized.startsWith("data-")) {
    return true;
  }

  if (normalized.startsWith("on")) {
    return true;
  }

  return normalized === "id" || normalized === "class" || normalized === "style";
}

export function computeAttributes(el: Element): A11yAttributes | undefined {
  const attributes: A11yAttributes = {};

  for (const name of el.getAttributeNames()) {
    if (!isAllowedAttributeName(name) || shouldIgnoreAttribute(name)) {
      continue;
    }

    const lowerName = name.toLowerCase();
    attributes[lowerName] = el.getAttribute(name) ?? "";
  }

  if (Object.keys(attributes).length === 0) {
    return undefined;
  }

  const sorted: A11yAttributes = {};
  const keys = Object.keys(attributes).sort();
  for (const key of keys) {
    const value = attributes[key];
    if (value !== undefined) {
      sorted[key] = value;
    }
  }

  return sorted;
}
