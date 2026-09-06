import { getFailureSnapshotRoot } from "./query.js";

type A11yNode = {
  role?: string;
  name?: string;
  checked?: boolean | "mixed";
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  children?: A11yNode[];
};

function escapeName(name: string): string {
  return name.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function formatNode(node: A11yNode, indent: number): string {
  const prefix = "  ".repeat(indent);
  const parts: string[] = [];

  if (node.role) {
    parts.push(node.role);
  }

  if (node.name) {
    parts.push(`"${escapeName(node.name)}"`);
  }

  const flags: string[] = [];
  if (node.checked === true) flags.push("checked");
  if (node.checked === "mixed") flags.push("mixed");
  if (node.checked === false) flags.push("unchecked");
  if (node.expanded === true) flags.push("expanded");
  if (node.expanded === false) flags.push("collapsed");
  if (node.selected === true) flags.push("selected");
  if (node.disabled === true) flags.push("disabled");

  if (flags.length > 0) {
    parts.push(`(${flags.join(", ")})`);
  }

  const line = `${prefix}${parts.join(" ")}`.trimEnd();
  const childLines = (node.children ?? []).flatMap((child) => formatNode(child, indent + 1));
  return [line, ...childLines].join("\n");
}

function readRole(props: Record<string, unknown>): string | undefined {
  if (typeof props.role === "string") {
    return props.role;
  }
  if (typeof props.accessibilityRole === "string") {
    return props.accessibilityRole;
  }
  return undefined;
}

function readName(
  props: Record<string, unknown>,
  typeName: string | undefined,
): string | undefined {
  if (typeof props.accessibilityLabel === "string") {
    return props.accessibilityLabel;
  }
  if (typeof props["aria-label"] === "string") {
    return props["aria-label"];
  }
  if (typeof props.placeholder === "string") {
    return props.placeholder;
  }
  if (typeof props.children === "string") {
    return props.children;
  }
  if (Array.isArray(props.children)) {
    const text = props.children.filter((child) => typeof child === "string").join("");
    if (text) {
      return text;
    }
  }
  if (typeName === "Text" && typeof props.children === "string") {
    return props.children;
  }
  return undefined;
}

function readChecked(props: Record<string, unknown>): boolean | "mixed" | undefined {
  const state = props.accessibilityState as { checked?: boolean | "mixed" } | undefined;
  if (state?.checked !== undefined) {
    return state.checked;
  }
  if (props["aria-checked"] === "mixed") {
    return "mixed";
  }
  if (props["aria-checked"] === true || props["aria-checked"] === "true") {
    return true;
  }
  if (props["aria-checked"] === false || props["aria-checked"] === "false") {
    return false;
  }
  return undefined;
}

function readStateFlag(
  props: Record<string, unknown>,
  key: "expanded" | "selected" | "disabled",
): boolean | undefined {
  const state = props.accessibilityState as Record<string, boolean | undefined> | undefined;
  if (state?.[key] !== undefined) {
    return state[key];
  }
  const ariaKey = `aria-${key}` as const;
  const ariaValue = props[ariaKey];
  if (ariaValue === true || ariaValue === "true") {
    return true;
  }
  if (ariaValue === false || ariaValue === "false") {
    return false;
  }
  return undefined;
}

function isHidden(props: Record<string, unknown>): boolean {
  if (props.accessibilityElementsHidden === true) {
    return true;
  }
  if (props["aria-hidden"] === true) {
    return true;
  }
  if (props.importantForAccessibility === "no-hide-descendants") {
    return true;
  }
  return false;
}

function buildNode(instance: {
  type: unknown;
  props: Record<string, unknown>;
  children: unknown[];
}): A11yNode | null {
  const props = instance.props ?? {};
  if (isHidden(props)) {
    return null;
  }

  const typeName =
    typeof instance.type === "string"
      ? instance.type
      : ((instance.type as { displayName?: string; name?: string } | null)?.displayName ??
        (instance.type as { name?: string } | null)?.name);

  const role = readRole(props);
  const name = readName(props, typeName);
  const checked = readChecked(props);
  const expanded = readStateFlag(props, "expanded");
  const selected = readStateFlag(props, "selected");
  const disabled = readStateFlag(props, "disabled");

  const childNodes = instance.children
    .map((child) => {
      if (!child || typeof child !== "object" || !("props" in child)) {
        return null;
      }
      return buildNode(child as typeof instance);
    })
    .filter((child): child is A11yNode => child !== null);

  const hasSemantics =
    role !== undefined ||
    name !== undefined ||
    checked !== undefined ||
    expanded !== undefined ||
    selected !== undefined ||
    disabled === true;

  if (!hasSemantics && childNodes.length === 0) {
    return null;
  }

  if (!hasSemantics && childNodes.length === 1) {
    return childNodes[0] ?? null;
  }

  return {
    role,
    name,
    checked,
    expanded,
    selected,
    disabled,
    children: childNodes.length > 0 ? childNodes : undefined,
  };
}

export function getA11ySnapshot(root: unknown): string {
  if (!root || typeof root !== "object") {
    return "";
  }

  const tree = buildNode(
    root as { type: unknown; props: Record<string, unknown>; children: unknown[] },
  );
  if (!tree) {
    return "";
  }

  return formatNode(tree, 0);
}

export function getFailureSnapshot(): string {
  const root = getFailureSnapshotRoot();
  if (!root) {
    return "";
  }
  return getA11ySnapshot(root);
}
