import type { Locator } from "@siheom/core";
import { concreteRoles, type ConcreteAriaRole } from "@siheom/snapshot/aria-roles";

export function locatorLog(target: Locator): string {
  const targetLog =
    typeof target.name === "string"
      ? `${target.role} "${target.name}"`
      : `${target.role} ${target.name}`;

  if (!target.within) {
    return targetLog;
  }

  return `within ${locatorLog(target.within)}: ${targetLog}`;
}

const CUSTOM_ROLES = ["label", "text"] as const;
type CustomRole = (typeof CUSTOM_ROLES)[number];
type RoleName = ConcreteAriaRole | CustomRole;

type QueryObject = { [K in RoleName]: (name: string | RegExp) => Locator } & {
  within: (container: Locator, target: Locator) => Locator;
};

function createQueryObject(): QueryObject {
  const roles: RoleName[] = [...concreteRoles, ...CUSTOM_ROLES];
  const result = {} as QueryObject;
  for (const role of roles) {
    result[role] = (name: string | RegExp) => ({ role, name });
  }
  result.within = (container, target) => ({
    role: target.role,
    name: target.name,
    within: container,
  });
  return result;
}

export const query: QueryObject = createQueryObject();
