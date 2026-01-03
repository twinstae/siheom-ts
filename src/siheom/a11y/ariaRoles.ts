import { roles, type ARIARole, type ARIADPubRole } from "aria-query";

export type ConcreteAriaRole = ARIARole | ARIADPubRole;

interface RoleDefinition {
	abstract?: boolean;
	props?: Record<string, unknown>;
	requiredProps?: Record<string, unknown>;
	nameFrom?: string[];
}

const concreteRolesList: ConcreteAriaRole[] = [];
const checkableRolesList: ConcreteAriaRole[] = [];
const nameFromContentRolesList: ConcreteAriaRole[] = [];

for (const [roleName, roleData] of roles.entries()) {
	const data = roleData as unknown as RoleDefinition;

	if (data.abstract) continue;

	const role = roleName as ConcreteAriaRole;
	concreteRolesList.push(role);

	const props = data.props || {};
	const requiredProps = data.requiredProps || {};
	if ("aria-checked" in props || "aria-checked" in requiredProps) {
		checkableRolesList.push(role);
	}

	if (data.nameFrom?.includes("contents")) {
		nameFromContentRolesList.push(role);
	}
}

concreteRolesList.sort();

export const concreteRoles = concreteRolesList as readonly ConcreteAriaRole[];

const checkableRolesSet = new Set<string>(checkableRolesList);
const nameFromContentRolesSet = new Set<string>(nameFromContentRolesList);

export function isCheckableRole(role: string): boolean {
	return checkableRolesSet.has(role);
}

export function isNameFromContentRole(role: string): boolean {
	return nameFromContentRolesSet.has(role);
}
