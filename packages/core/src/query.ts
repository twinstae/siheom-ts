import { screen, within as tlWithin } from "@testing-library/dom";
import { concreteRoles, type ConcreteAriaRole } from "@siheom/snapshot/aria-roles";
import type { Locator } from "./types.js";

type Queries = Pick<
  typeof screen,
  | "getByRole"
  | "queryByRole"
  | "getAllByRole"
  | "queryAllByRole"
  | "getByLabelText"
  | "queryByLabelText"
  | "getAllByLabelText"
  | "queryAllByLabelText"
>;

function getQueries(locator: Locator): Queries {
  if (!locator.within) {
    return screen;
  }

  const container = getElement(locator.within, true);
  return tlWithin(container);
}

export const getElement = <T extends boolean>(
  locator: Locator,
  isVisible: T,
): T extends true ? HTMLElement : HTMLElement | null => {
  const queries = getQueries(locator);

  if (locator.role === "label") {
    if (isVisible) {
      return queries.getByLabelText(locator.name);
    }
    return queries.queryByLabelText(locator.name) as HTMLElement;
  }

  if (isVisible) {
    return queries.getByRole(locator.role, { name: locator.name });
  }
  return queries.queryByRole(locator.role, {
    name: locator.name,
  }) as HTMLElement;
};

export const getElements = <T extends boolean>(
  locator: Locator,
  isVisible: T,
): T extends true ? HTMLElement[] : HTMLElement[] | null => {
  const queries = getQueries(locator);

  if (locator.role === "label") {
    if (isVisible) {
      return queries.getAllByLabelText(locator.name);
    }
    return queries.queryAllByLabelText(locator.name);
  }
  if (isVisible) {
    return queries.getAllByRole(locator.role, {
      name: locator.name,
    });
  }
  return queries.queryAllByRole(locator.role, {
    name: locator.name,
  });
};

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
export type RoleName = ConcreteAriaRole | CustomRole;

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
