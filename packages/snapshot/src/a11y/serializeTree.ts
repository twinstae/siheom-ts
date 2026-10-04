import type {
  A11yAttributes,
  A11yInteraction,
  A11yNode,
  A11yStates,
  A11yProperties,
  A11yRelation,
  A11yRelations,
  A11yLiveRegion,
  A11yOther,
  A11yDragDrop,
  SerializeOptions,
} from "./types.js";

function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function formatBracketedAttribute(key: string, val: unknown): string {
  if (val === null) {
    return `[${key}=null]`;
  }
  if (typeof val === "string") {
    return `[${key}="${escapeString(val)}"]`;
  }
  if (typeof val === "number" || typeof val === "boolean" || typeof val === "bigint") {
    return `[${key}=${val}]`;
  }
  return `[${key}=${JSON.stringify(val)}]`;
}

const STATE_KEYS: (keyof A11yStates)[] = [
  "hidden",
  "disabled",
  "focusable",
  "focused",
  "modal",
  "expanded",
  "pressed",
  "checked",
  "selected",
  "current",
  "invalid",
  "required",
  "readonly",
];

function serializeStates(states: A11yStates): string {
  const parts: string[] = [];
  for (const key of STATE_KEYS) {
    const value = states[key];
    if (value !== undefined) parts.push(`[${key}=${value}]`);
  }
  return parts.join(" ");
}

function serializeInteraction(interaction: A11yInteraction, isVerbose: boolean): string {
  const parts: string[] = [];
  if (isVerbose || interaction.focusable) parts.push(`[focusable=${interaction.focusable}]`);
  if (isVerbose || interaction.tabbable) parts.push(`[tabbable=${interaction.tabbable}]`);
  if (isVerbose || interaction.focused) parts.push(`[focused=${interaction.focused}]`);
  if (interaction.keyshortcuts)
    parts.push(`[keyshortcuts="${escapeString(interaction.keyshortcuts)}"]`);
  if (interaction.accesskey) parts.push(`[accesskey="${escapeString(interaction.accesskey)}"]`);
  return parts.join(" ");
}

function serializeAttributes(attributes: A11yAttributes): string {
  return Object.entries(attributes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `[${key}="${escapeString(value)}"]`)
    .join(" ");
}

const PROPERTY_ORDER: (keyof A11yProperties)[] = [
  "autocomplete",
  "colcount",
  "colindex",
  "colspan",
  "haspopup",
  "level",
  "multiselectable",
  "orientation",
  "posinset",
  "rowcount",
  "rowindex",
  "rowspan",
  "setsize",
  "sort",
  "valuemax",
  "valuemin",
  "valuenow",
  "valuetext",
];

function serializeProperties(props: A11yProperties): string {
  const parts: string[] = [];
  for (const key of PROPERTY_ORDER) {
    const val = props[key];
    if (val === undefined) continue;
    parts.push(formatBracketedAttribute(key, val));
  }
  return parts.join(" ");
}

function formatRelation(rel: A11yRelation | { id: string; name: string | null }): string {
  if (rel.name === null) {
    return `null`;
  }
  return `"${escapeString(rel.name)}" (#${rel.id})`;
}

function serializeRelationsBlock(relations: A11yRelations, baseIndent: string): string[] {
  const lines: string[] = [];
  const indent = `${baseIndent}  `;
  lines.push(`${baseIndent}- relations:\n`);

  const keys = Object.keys(relations).sort() as (keyof A11yRelations)[];
  for (const key of keys) {
    const val = relations[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      lines.push(`${indent}${key}: ${val.map(formatRelation).join(", ")}\n`);
    } else {
      lines.push(`${indent}${key}: ${formatRelation(val)}\n`);
    }
  }
  return lines;
}

/** Format nullable live/drag attrs; strings are quoted when `quote` is true. */
function formatNullableBracketed(
  key: string,
  value: string | boolean | null | undefined,
  options: { quote?: boolean; suffix?: string } = {},
): string | undefined {
  if (value === undefined) return undefined;
  const suffix = options.suffix ?? "";
  if (value === null) return `[${key}=null]${suffix}`;
  if (options.quote && typeof value === "string") {
    return `[${key}="${escapeString(value)}"]${suffix}`;
  }
  return `[${key}=${value}]${suffix}`;
}

function serializeLiveRegion(liveRegion: A11yLiveRegion): string {
  const parts: string[] = [];
  const live = formatNullableBracketed("live", liveRegion.live, { quote: true });
  if (live) parts.push(live);
  const atomic = formatNullableBracketed("atomic", liveRegion.atomic);
  if (atomic) parts.push(atomic);
  const relevant = formatNullableBracketed("relevant", liveRegion.relevant, { quote: true });
  if (relevant) parts.push(relevant);
  const busy = formatNullableBracketed("busy", liveRegion.busy);
  if (busy) parts.push(busy);
  return parts.join(" ");
}

function serializeDragDrop(dragDrop: A11yDragDrop): string {
  const parts: string[] = [];
  const dropeffect = formatNullableBracketed("dropeffect", dragDrop.dropeffect, {
    quote: true,
    suffix: " (deprecated)",
  });
  if (dropeffect) parts.push(dropeffect);
  const grabbed = formatNullableBracketed("grabbed", dragDrop.grabbed, {
    suffix: " (deprecated)",
  });
  if (grabbed) parts.push(grabbed);
  return parts.join(" ");
}

function serializeOther(other: A11yOther): string {
  const keys = Object.keys(other).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const val = other[key];
    if (val === undefined) continue;
    parts.push(formatBracketedAttribute(key, val));
  }
  return parts.join(" ");
}

export function serializeA11yTree(node: A11yNode, options: SerializeOptions = {}): string {
  return serializeNode(node, 0, options);
}

function hasSerializableDetails(node: A11yNode): boolean {
  return (
    node.value !== undefined ||
    node.description !== undefined ||
    node.states !== undefined ||
    node.interaction !== undefined ||
    node.properties !== undefined ||
    node.relations !== undefined ||
    node.liveRegion !== undefined ||
    node.dragDrop !== undefined ||
    node.attributes !== undefined ||
    node.other !== undefined
  );
}

function isAnonymousTextLeaf(node: A11yNode): boolean {
  return (
    node.role === "" &&
    Boolean(node.name) &&
    node.children.length === 0 &&
    !hasSerializableDetails(node)
  );
}

function serializeAnonymousTextLeaf(node: A11yNode, indent: string): string {
  return `${indent}"${escapeString(node.name)}"\n`;
}

function isAnonymousFragment(node: A11yNode): boolean {
  return node.role === "" && !hasSerializableDetails(node);
}

function serializeAnonymousFragment(
  node: A11yNode,
  depth: number,
  options: SerializeOptions,
): string {
  let result = "";
  for (const child of node.children) {
    result += serializeNode(child, depth, options);
  }
  return result;
}

function buildRoleHeader(node: A11yNode, indent: string, isVerbose: boolean): string {
  const role = node.role || "generic";
  let header = `${indent}${role}:`;
  if (node.name || isVerbose || node.children.length === 0) {
    header += ` "${escapeString(node.name)}"`;
  }

  const headerExtras: string[] = [];
  if (node.value !== undefined) {
    if (node.value === null) {
      headerExtras.push("[value=null]");
    } else {
      headerExtras.push(`[value="${escapeString(node.value)}"]`);
    }
  }
  if (node.description) {
    headerExtras.push(`[description="${escapeString(node.description)}"]`);
  }
  if (isVerbose) headerExtras.push(`[childCount=${node.children.length}]`);
  if (headerExtras.length > 0) {
    header += ` ${headerExtras.join(" ")}`;
  }
  return `${header.trimEnd()}\n`;
}

function appendSectionLine(
  lines: string[],
  childIndent: string,
  label: string,
  content: string | undefined,
): void {
  if (!content) return;
  lines.push(`${childIndent}- ${label}: ${content}\n`);
}

function appendNodeDetailSections(
  lines: string[],
  node: A11yNode,
  childIndent: string,
  isVerbose: boolean,
): void {
  if (node.states) {
    appendSectionLine(lines, childIndent, "states", serializeStates(node.states));
  }
  if (node.interaction) {
    appendSectionLine(
      lines,
      childIndent,
      "interaction",
      serializeInteraction(node.interaction, isVerbose),
    );
  }
  if (node.properties) {
    appendSectionLine(lines, childIndent, "properties", serializeProperties(node.properties));
  }
  if (node.relations) {
    lines.push(...serializeRelationsBlock(node.relations, childIndent));
  }
  if (node.liveRegion) {
    appendSectionLine(lines, childIndent, "live-region", serializeLiveRegion(node.liveRegion));
  }
  if (node.dragDrop) {
    appendSectionLine(lines, childIndent, "drag-and-drop", serializeDragDrop(node.dragDrop));
  }
  if (isVerbose && node.attributes) {
    appendSectionLine(lines, childIndent, "attributes", serializeAttributes(node.attributes));
  }
  if (node.other) {
    appendSectionLine(lines, childIndent, "other", serializeOther(node.other));
  }
}

function serializeNode(node: A11yNode, depth: number, options: SerializeOptions): string {
  const indent = "  ".repeat(depth);
  const isVerbose = options.mode === "verbose";

  if (isAnonymousTextLeaf(node)) {
    return serializeAnonymousTextLeaf(node, indent);
  }
  if (isAnonymousFragment(node)) {
    return serializeAnonymousFragment(node, depth, options);
  }

  const lines: string[] = [buildRoleHeader(node, indent, isVerbose)];
  appendNodeDetailSections(lines, node, `${indent}  `, isVerbose);
  for (const child of node.children) {
    lines.push(serializeNode(child, depth + 1, options));
  }
  return lines.join("");
}
