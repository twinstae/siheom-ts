import { computeAccessibleName } from "dom-accessibility-api";
import type { A11yRelation, A11yRelationOrNull, A11yRelations } from "./types.js";

const RELATION_ATTRIBUTES = {
  activedescendant: "aria-activedescendant",
  controls: "aria-controls",
  describedby: "aria-describedby",
  details: "aria-details",
  errormessage: "aria-errormessage",
  flowto: "aria-flowto",
  labelledby: "aria-labelledby",
  owns: "aria-owns",
} as const;

type RelationKey = keyof typeof RELATION_ATTRIBUTES;

const SINGLE_RELATIONS = new Set<RelationKey>(["activedescendant", "errormessage", "details"]);
const MULTI_RELATIONS = new Set<RelationKey>([
  "labelledby",
  "describedby",
  "controls",
  "owns",
  "flowto",
]);

function resolveRelation(
  id: string,
  root: Element,
  isVerbose: boolean,
): A11yRelation | A11yRelationOrNull | null {
  const doc = root.ownerDocument ?? (root as unknown as Document);
  const el = doc.getElementById(id);
  if (!el) {
    return isVerbose ? { id, name: null } : null;
  }

  const name = computeAccessibleName(el);
  if (!name) {
    return isVerbose ? { id, name: null } : null;
  }

  return { id, name };
}

function getIdRefs(el: Element, attr: string): string[] {
  const value = el.getAttribute(attr);
  if (!value) return [];
  return value.trim().split(/\s+/).filter(Boolean);
}

function computeEmptyVerboseRelation(
  hasAttr: boolean,
  ids: string[],
  isVerbose: boolean,
): null | undefined {
  if (isVerbose && hasAttr && ids.length === 0) return null;
  return undefined;
}

function resolveSingleRelation(
  ids: string[],
  root: Element,
  isVerbose: boolean,
): A11yRelation | A11yRelationOrNull | undefined {
  const firstId = ids[0];
  if (!firstId) return undefined;
  return resolveRelation(firstId, root, isVerbose) ?? undefined;
}

function resolveMultiRelations(
  ids: string[],
  root: Element,
  isVerbose: boolean,
): Array<A11yRelation | A11yRelationOrNull> | undefined {
  const resolved: Array<A11yRelation | A11yRelationOrNull> = [];
  for (const id of ids) {
    const relation = resolveRelation(id, root, isVerbose);
    if (relation) resolved.push(relation);
  }
  if (resolved.length === 0) return undefined;
  return resolved;
}

function computeRelationEntry(
  el: Element,
  key: RelationKey,
  attr: string,
  root: Element,
  isVerbose: boolean,
): A11yRelations[RelationKey] | null | undefined {
  const hasAttr = el.hasAttribute(attr);
  const ids = getIdRefs(el, attr);
  const emptyVerbose = computeEmptyVerboseRelation(hasAttr, ids, isVerbose);
  if (emptyVerbose === null) return null;
  if (ids.length === 0) return undefined;

  if (SINGLE_RELATIONS.has(key)) {
    return resolveSingleRelation(ids, root, isVerbose);
  }
  if (MULTI_RELATIONS.has(key)) {
    return resolveMultiRelations(ids, root, isVerbose);
  }
  return undefined;
}

export function computeRelations(el: Element, isVerbose = false): A11yRelations | undefined {
  const relations: A11yRelations = {};
  const root = el.ownerDocument?.documentElement ?? el;
  let hasAny = false;

  for (const [key, attr] of Object.entries(RELATION_ATTRIBUTES) as Array<[RelationKey, string]>) {
    const entry = computeRelationEntry(el, key, attr, root, isVerbose);
    if (entry === undefined) continue;
    (relations as Record<string, unknown>)[key] = entry;
    hasAny = true;
  }

  return hasAny ? relations : undefined;
}
