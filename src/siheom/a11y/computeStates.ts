import type { A11yNodeStates } from "./types.ts";

// Roles that can have checked state
const CHECKABLE_ROLES = new Set([
	"checkbox",
	"radio",
	"menuitemcheckbox",
	"menuitemradio",
	"switch",
	"option",
]);

function checkBooleanAttribute(el: Element, attr: string): boolean | undefined {
	const val = el.getAttribute(attr);
	if (val === "true") return true;
	if (val === "false") return false;
	return undefined;
}

export function computeAriaChecked(el: Element): boolean | undefined {
	// Handle indeterminate state
	if ("indeterminate" in el && (el as HTMLInputElement).indeterminate) {
		return undefined;
	}
	// Native checked property
	if ("checked" in el) {
		return (el as HTMLInputElement).checked;
	}
	// ARIA attribute
	return checkBooleanAttribute(el, "aria-checked");
}

export function computeAriaExpanded(el: Element): boolean | undefined {
	return checkBooleanAttribute(el, "aria-expanded");
}

export function computeAriaSelected(el: Element): boolean | undefined {
	// Native option element
	if (el.tagName === "OPTION") {
		return (el as HTMLOptionElement).selected;
	}
	return checkBooleanAttribute(el, "aria-selected");
}

export function computeAriaPressed(el: Element): boolean | undefined {
	return checkBooleanAttribute(el, "aria-pressed");
}

export function computeAriaDisabled(el: Element): boolean {
	if ((el as HTMLButtonElement).disabled) {
		return true;
	}
	return el.getAttribute("aria-disabled") === "true";
}

export function computeAriaCurrent(el: Element): string | boolean | undefined {
	const value = el.getAttribute("aria-current");
	if (value === "true") return true;
	if (value === "false") return false;
	if (value) return value;
	return undefined;
}

export function computeHeadingLevel(el: Element): number | undefined {
	const implicit: Record<string, number> = {
		H1: 1,
		H2: 2,
		H3: 3,
		H4: 4,
		H5: 5,
		H6: 6,
	};

	// Explicit aria-level overrides implicit
	const ariaLevel = el.getAttribute("aria-level");
	if (ariaLevel) {
		return Number(ariaLevel);
	}

	return implicit[el.tagName];
}

export function computeAriaValueNow(el: Element): number | undefined {
	const val = el.getAttribute("aria-valuenow");
	return val ? Number(val) : undefined;
}

export function computeAriaValueMin(el: Element): number | undefined {
	const val = el.getAttribute("aria-valuemin");
	return val ? Number(val) : undefined;
}

export function computeAriaValueMax(el: Element): number | undefined {
	const val = el.getAttribute("aria-valuemax");
	return val ? Number(val) : undefined;
}

export function computeAriaValueText(el: Element): string | undefined {
	return el.getAttribute("aria-valuetext") ?? undefined;
}

export function computeAllStates(el: Element, role: string): A11yNodeStates {
	const states: A11yNodeStates = {};

	// Only compute checked for checkable roles
	if (CHECKABLE_ROLES.has(role)) {
		const checked = computeAriaChecked(el);
		if (checked !== undefined) states.checked = checked;
	}

	const expanded = computeAriaExpanded(el);
	if (expanded !== undefined) states.expanded = expanded;

	const selected = computeAriaSelected(el);
	if (selected !== undefined) states.selected = selected;

	const disabled = computeAriaDisabled(el);
	if (disabled) states.disabled = disabled;

	const pressed = computeAriaPressed(el);
	if (pressed !== undefined) states.pressed = pressed;

	const current = computeAriaCurrent(el);
	if (current !== undefined) states.current = current;

	const valueNow = computeAriaValueNow(el);
	if (valueNow !== undefined) states.valueNow = valueNow;

	const valueMin = computeAriaValueMin(el);
	if (valueMin !== undefined) states.valueMin = valueMin;

	const valueMax = computeAriaValueMax(el);
	if (valueMax !== undefined) states.valueMax = valueMax;

	const valueText = computeAriaValueText(el);
	if (valueText !== undefined) states.valueText = valueText;

	return states;
}
