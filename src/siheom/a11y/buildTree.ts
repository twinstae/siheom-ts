import {
	computeAccessibleName,
	computeAccessibleDescription,
} from "dom-accessibility-api";
import type { A11yNode } from "./types.ts";
import { getRole } from "./roleHelpers.ts";
import { isInaccessible } from "./isAccessible.ts";
import { computeAllStates, computeHeadingLevel } from "./computeStates.ts";

// Roles that should be skipped (wrapper elements with no semantic meaning)
const SKIP_ROLES = new Set(["generic", "presentation", "none"]);

// Elements whose text content IS their accessible name - skip children
const TEXT_NAME_ROLES = new Set([
	"button",
	"cell",
	"checkbox",
	"columnheader",
	"gridcell",
	"heading",
	"link",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"radio",
	"row",
	"rowheader",
	"switch",
	"tab",
	"tooltip",
]);

export function buildA11yTree(el: HTMLElement): A11yNode | null {
	// Skip inaccessible elements
	if (isInaccessible(el)) {
		return null;
	}

	// Skip iframes and SVGs
	if (el.tagName === "IFRAME" || el.tagName === "SVG") {
		return null;
	}

	const role = getRole(el);

	// Skip generic/presentation/none roles but process children
	if (SKIP_ROLES.has(role) || role === "") {
		const children = processChildren(el);
		if (children.length > 0) {
			return { role: "", name: "", states: {}, children };
		}
		return null;
	}

	const name = computeAccessibleName(el);
	const description = computeAccessibleDescription(el);
	const states = computeAllStates(el, role);

	// For text-name elements, check if children just duplicate the name
	const shouldSkipChildren =
		TEXT_NAME_ROLES.has(role) && hasOnlyTextMatchingName(el, name);

	const node: A11yNode = {
		role,
		name,
		states,
		children: shouldSkipChildren ? [] : processChildren(el),
	};

	// Add optional properties
	if (description) {
		node.description = description;
	}

	// Add heading level
	if (role === "heading") {
		const level = computeHeadingLevel(el);
		if (level) {
			node.level = level;
		}
	}

	// Add value for form controls (textbox, spinbutton, etc.)
	if (isFormControl(el)) {
		const value = (el as HTMLInputElement).value;
		node.value = value;
	}

	return node;
}

function hasOnlyTextMatchingName(el: HTMLElement, name: string): boolean {
	const textContent = el.textContent?.trim() || "";
	return textContent === name;
}

function isFormControl(el: HTMLElement): boolean {
	const tag = el.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function processChildren(el: HTMLElement): A11yNode[] {
	const children: A11yNode[] = [];

	for (const child of el.childNodes) {
		if (child instanceof HTMLElement) {
			const node = buildA11yTree(child);
			if (node) {
				// Flatten empty wrapper nodes (no role)
				if (node.role === "" && node.children.length > 0) {
					children.push(...node.children);
				} else if (node.role !== "") {
					children.push(node);
				}
			}
		} else if (child instanceof Text) {
			const text = child.textContent?.trim();
			if (text) {
				// Raw text without explicit role (per user preference)
				children.push({
					role: "",
					name: text,
					states: {},
					children: [],
				});
			}
		}
	}

	return children;
}
