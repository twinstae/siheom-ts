import type { A11yProperties } from "./types.js";
import { fromDefinedEntries, mergeDefinedParts } from "./assignDefined.js";

function getNumberAttribute(el: Element, attr: string): number | undefined {
  const val = el.getAttribute(attr);
  if (val === null) return undefined;
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
}

function getEnumeratedAttribute<T extends string>(
  el: Element,
  attr: string,
  allowed: readonly T[],
): T | undefined {
  const val = el.getAttribute(attr);
  if (val !== null && (allowed as readonly string[]).includes(val)) {
    return val as T;
  }
  return undefined;
}

export function computeLevel(el: Element, role: string): number | undefined {
  if (role !== "heading") return undefined;

  const ariaLevel = getNumberAttribute(el, "aria-level");
  if (ariaLevel !== undefined && ariaLevel >= 1 && ariaLevel <= 6) {
    return ariaLevel;
  }

  const tag = el.tagName;
  if (/^H[1-6]$/.test(tag)) {
    return Number.parseInt(tag[1] as string, 10);
  }

  return undefined;
}

export function computeHaspopup(el: Element): string | boolean | undefined {
  const val = el.getAttribute("aria-haspopup");
  if (val === null) return undefined;
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
}

export function computeOrientation(el: Element): "horizontal" | "vertical" | undefined {
  const val = el.getAttribute("aria-orientation");
  if (val === "horizontal") return "horizontal";
  if (val === "vertical") return "vertical";
  return undefined;
}

export function computeMultiselectable(el: Element): boolean | undefined {
  const val = el.getAttribute("aria-multiselectable");
  if (val === "true") return true;
  return undefined;
}

export function computeAutocomplete(el: Element): string | undefined {
  return getEnumeratedAttribute(el, "aria-autocomplete", [
    "none",
    "inline",
    "list",
    "both",
  ] as const);
}

export function computeValuemin(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-valuemin");
}

export function computeValuemax(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-valuemax");
}

export function computeValuenow(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-valuenow");
}

export function computeValuetext(el: Element): string | undefined {
  return el.getAttribute("aria-valuetext") ?? undefined;
}

export function computePosinset(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-posinset");
}

export function computeSetsize(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-setsize");
}

export function computeColcount(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-colcount");
}

export function computeColindex(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-colindex");
}

export function computeColspan(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-colspan");
}

export function computeRowcount(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-rowcount");
}

export function computeRowindex(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-rowindex");
}

export function computeRowspan(el: Element): number | undefined {
  return getNumberAttribute(el, "aria-rowspan");
}

export function computeSort(
  el: Element,
): "ascending" | "descending" | "none" | "other" | undefined {
  return getEnumeratedAttribute(el, "aria-sort", [
    "ascending",
    "descending",
    "none",
    "other",
  ] as const);
}

const SET_ITEM_ROLES = new Set([
  "listitem",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "tab",
  "treeitem",
  "row",
]);

const VALUE_RANGE_ROLES = new Set(["slider", "spinbutton", "progressbar", "scrollbar", "meter"]);

const TABLE_ROLES = new Set(["table", "grid", "treegrid"]);
const CELL_ROLES = new Set(["cell", "gridcell", "columnheader", "rowheader"]);
const ROW_ROLE = "row";

function collectUniversalProperties(el: Element, role: string): A11yProperties {
  return fromDefinedEntries([
    ["level", computeLevel(el, role)],
    ["haspopup", computeHaspopup(el)],
    ["orientation", computeOrientation(el)],
    ["multiselectable", computeMultiselectable(el)],
    ["autocomplete", computeAutocomplete(el)],
  ]);
}

function collectValueRangeProperties(el: Element, role: string): A11yProperties {
  if (!VALUE_RANGE_ROLES.has(role)) return {};
  return fromDefinedEntries([
    ["valuemin", computeValuemin(el)],
    ["valuemax", computeValuemax(el)],
    ["valuenow", computeValuenow(el)],
    ["valuetext", computeValuetext(el)],
  ]);
}

function collectSetItemProperties(el: Element, role: string): A11yProperties {
  if (!SET_ITEM_ROLES.has(role)) return {};
  return fromDefinedEntries([
    ["posinset", computePosinset(el)],
    ["setsize", computeSetsize(el)],
  ]);
}

function collectTableCountProperties(el: Element, role: string): A11yProperties {
  if (!TABLE_ROLES.has(role)) return {};
  return fromDefinedEntries([
    ["colcount", computeColcount(el)],
    ["rowcount", computeRowcount(el)],
  ]);
}

function collectRowIndexProperty(el: Element, role: string): A11yProperties {
  if (role !== ROW_ROLE) return {};
  return fromDefinedEntries([["rowindex", computeRowindex(el)]]);
}

function collectCellProperties(el: Element, role: string): A11yProperties {
  if (!CELL_ROLES.has(role)) return {};
  return fromDefinedEntries([
    ["colindex", computeColindex(el)],
    ["colspan", computeColspan(el)],
    ["rowspan", computeRowspan(el)],
  ]);
}

function collectHeaderSortProperty(el: Element, role: string): A11yProperties {
  if (role !== "columnheader" && role !== "rowheader") return {};
  return fromDefinedEntries([["sort", computeSort(el)]]);
}

export function computeProperties(el: Element, role: string): A11yProperties | undefined {
  return mergeDefinedParts(
    collectUniversalProperties(el, role),
    collectValueRangeProperties(el, role),
    collectSetItemProperties(el, role),
    collectTableCountProperties(el, role),
    collectRowIndexProperty(el, role),
    collectCellProperties(el, role),
    collectHeaderSortProperty(el, role),
  );
}
