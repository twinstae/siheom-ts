import { screen, within as rntlWithin, type RenderResult } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";
import type { Locator } from "@siheom/core";

export { query, locatorLog } from "./queryBuilders.js";

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
  | "getByText"
  | "queryByText"
  | "getAllByText"
  | "queryAllByText"
>;

function getQueries(locator: Locator): Queries {
  if (!locator.within) {
    return screen;
  }

  const container = getElement(locator.within, true);
  return rntlWithin(container);
}

export function getElement(locator: Locator, isVisible: true): TestInstance;
export function getElement(locator: Locator, isVisible: false): TestInstance | null;
export function getElement(locator: Locator, isVisible: boolean): TestInstance | null {
  const queries = getQueries(locator);

  if (locator.role === "label") {
    if (isVisible) {
      return queries.getByLabelText(locator.name);
    }
    return queries.queryByLabelText(locator.name);
  }

  if (locator.role === "text") {
    if (isVisible) {
      return queries.getByText(locator.name);
    }
    return queries.queryByText(locator.name);
  }

  if (locator.role === "textbox") {
    if (isVisible) {
      return queries.getByLabelText(locator.name);
    }
    return queries.queryByLabelText(locator.name);
  }

  if (locator.role === "dialog") {
    if (isVisible) {
      return queries.getByLabelText(locator.name);
    }
    return queries.queryByLabelText(locator.name);
  }

  if (locator.role === "listitem" || locator.role === "list") {
    if (isVisible) {
      return queries.getByLabelText(locator.name);
    }
    return queries.queryByLabelText(locator.name);
  }

  if (isVisible) {
    return queries.getByRole(locator.role, { name: locator.name });
  }
  return queries.queryByRole(locator.role, { name: locator.name });
}

export function getElements(locator: Locator, isVisible: true): TestInstance[];
export function getElements(locator: Locator, isVisible: false): TestInstance[] | null;
export function getElements(locator: Locator, isVisible: boolean): TestInstance[] | null {
  const queries = getQueries(locator);

  if (locator.role === "label") {
    if (isVisible) {
      return queries.getAllByLabelText(locator.name);
    }
    return queries.queryAllByLabelText(locator.name);
  }

  if (locator.role === "text") {
    if (isVisible) {
      return queries.getAllByText(locator.name);
    }
    return queries.queryAllByText(locator.name);
  }

  if (isVisible) {
    return queries.getAllByRole(locator.role, { name: locator.name });
  }
  return queries.queryAllByRole(locator.role, { name: locator.name });
}

let lastRender: RenderResult | null = null;

export function setLastRender(result: RenderResult | null): void {
  lastRender = result;
}

export function getLastRender(): RenderResult | null {
  return lastRender;
}

export function getFailureSnapshotRoot(): TestInstance | null {
  if (!lastRender) {
    return null;
  }

  return lastRender.root ?? lastRender.container ?? null;
}
