import { buildA11yTree } from "./a11y/buildTree.js";
import { serializeA11yTree } from "./a11y/serializeTree.js";
import type { A11yNode, BuildA11yTreeOptions, SerializeOptions } from "./a11y/types.js";

export type {
  A11yNode,
  A11yStates,
  A11yInteraction,
  A11yAttributes,
  BuildA11yTreeOptions,
  SerializeOptions,
} from "./a11y/types.js";

export interface A11ySnapshotOptions extends BuildA11yTreeOptions {
  serialize?: SerializeOptions;
}

/**
 * Serializes an HTML element to an accessibility tree string.
 * Used for snapshot testing to verify accessible semantics.
 */
export function getA11ySnapshot(element: HTMLElement, options: A11ySnapshotOptions = {}): string {
  const tree = buildA11yTree(element, options);
  if (!tree) {
    return "";
  }
  const serializeOpts: SerializeOptions = {
    mode: options.serialize?.mode ?? options.mode,
  };
  return serializeA11yTree(tree, serializeOpts);
}

/**
 * Returns the structured accessibility tree for programmatic access.
 */
export function getA11yTree(
  element: HTMLElement,
  options: BuildA11yTreeOptions = {},
): A11yNode | null {
  return buildA11yTree(element, options);
}
