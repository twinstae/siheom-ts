import { buildA11yTree } from "./a11y/buildTree.ts";
import { serializeA11yTree } from "./a11y/serializeTree.ts";

export type { A11yNode, A11yNodeStates } from "./a11y/types.ts";

/**
 * Serializes an HTML element to an accessibility tree string.
 * Used for snapshot testing to verify accessible semantics.
 */
export function getA11ySnapshot(element: HTMLElement): string {
	const tree = buildA11yTree(element);
	if (!tree) {
		return "";
	}
	return serializeA11yTree(tree).trim();
}

/**
 * Returns the structured accessibility tree for programmatic access.
 */
export function getA11yTree(element: HTMLElement) {
	return buildA11yTree(element);
}
