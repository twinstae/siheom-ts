/**
 * Ported from @testing-library/dom's role-helpers.js
 * @see https://github.com/testing-library/dom-testing-library/blob/e395d5b8ecd4ec95cc02540ddcf16571ecd33e0f/src/role-helpers.js
 */
import { elementRoles } from "aria-query";

type ARIAQueryElement = {
	name: string;
	attributes: Array<{
		name: string;
		value?: string;
		constraints?: Array<"undefined" | "set">;
	}>;
};

type ElementRoleEntry = {
	match: (el: Element) => boolean;
	roles: string[];
	specificity: number;
};

function makeElementSelector({ name, attributes }: ARIAQueryElement): string {
	return `${name}${attributes
		.map(({ name: attributeName, value, constraints = [] }) => {
			const shouldNotExist = constraints.includes("undefined");
			const shouldBeNonEmpty = constraints.includes("set");
			const hasExplicitValue = typeof value !== "undefined";

			if (hasExplicitValue) {
				return `[${attributeName}="${value}"]`;
			}
			if (shouldNotExist) {
				return `:not([${attributeName}])`;
			}
			if (shouldBeNonEmpty) {
				return `[${attributeName}]:not([${attributeName}=""])`;
			}
			return `[${attributeName}]`;
		})
		.join("")}`;
}

function getSelectorSpecificity({
	attributes = [],
}: Partial<ARIAQueryElement>): number {
	return attributes.length;
}

function buildElementRoleList(
	elementRolesMap: typeof elementRoles,
): ElementRoleEntry[] {
	const result: ElementRoleEntry[] = [];

	for (const [element, roles] of elementRolesMap.entries()) {
		let { attributes = [] } = element as ARIAQueryElement;

		// Handle type="text" edge case
		// https://github.com/testing-library/dom-testing-library/issues/814
		const typeTextIndex = attributes.findIndex(
			(attr) => attr.value && attr.name === "type" && attr.value === "text",
		);

		if (typeTextIndex >= 0) {
			attributes = [
				...attributes.slice(0, typeTextIndex),
				...attributes.slice(typeTextIndex + 1),
			];
		}

		const selector = makeElementSelector({
			...(element as ARIAQueryElement),
			attributes,
		});

		const match = (node: Element): boolean => {
			if (typeTextIndex >= 0 && (node as HTMLInputElement).type !== "text") {
				return false;
			}
			return node.matches(selector);
		};

		result.push({
			match,
			roles: Array.from(roles),
			specificity: getSelectorSpecificity(element as ARIAQueryElement),
		});
	}

	return result.sort((a, b) => b.specificity - a.specificity);
}

const elementRoleList = buildElementRoleList(elementRoles);

export function getImplicitAriaRoles(el: Element): string[] {
	for (const { match, roles } of elementRoleList) {
		if (match(el)) {
			return [...roles];
		}
	}
	return [];
}

export function getRole(el: Element): string {
	// Explicit role takes precedence
	const explicitRole = el.getAttribute("role");
	if (explicitRole) {
		// Handle multiple roles (space-separated) - take first valid
		const firstRole = explicitRole.split(" ")[0];
		return firstRole || "";
	}

	// Fall back to implicit role
	const implicitRoles = getImplicitAriaRoles(el);
	return implicitRoles[0] || "";
}
