import { screen } from "@testing-library/dom";
import type { Locator } from "./types";
import { concreteRoles, type ConcreteAriaRole } from "./a11y/ariaRoles";

export const getElement = <T extends boolean>(
	locator: Locator,
	isVisible: T,
): T extends true ? HTMLElement : HTMLElement | null => {
	if (locator.role === "label") {
		if (isVisible) {
			return screen.getByLabelText(locator.name);
		}
		return screen.queryByLabelText(locator.name) as HTMLElement;
	}

	if (isVisible) {
		return screen.getByRole(locator.role, { name: locator.name });
	}
	return screen.queryByRole(locator.role, {
		name: locator.name,
	}) as HTMLElement;
};

export const getElements = <T extends boolean>(
	locator: Locator,
	isVisible: T,
): T extends true ? HTMLElement[] : HTMLElement[] | null => {
	if (locator.role === "label") {
		if (isVisible) {
			return screen.getAllByLabelText(locator.name);
		}
		return screen.queryAllByLabelText(locator.name);
	}
	if (isVisible) {
		return screen.getAllByRole(locator.role, {
			name: locator.name,
		});
	}
	return screen.queryAllByRole(locator.role, {
		name: locator.name,
	});
};

export function locatorLog(target: Locator) {
	if (typeof target.name === "string") {
		return `${target.role} "${target.name}"`;
	}
	return `${target.role} ${target.name}`;
}

const CUSTOM_ROLES = ["label", "text"] as const;
type CustomRole = (typeof CUSTOM_ROLES)[number];
export type RoleName = ConcreteAriaRole | CustomRole;

type QueryObject = { [K in RoleName]: (name: string | RegExp) => Locator };

function createQueryObject(): QueryObject {
	const roles: RoleName[] = [...concreteRoles, ...CUSTOM_ROLES];
	const result = {} as QueryObject;
	for (const role of roles) {
		result[role] = (name: string | RegExp) => ({ role, name });
	}
	return result;
}

export const query: QueryObject = createQueryObject();
