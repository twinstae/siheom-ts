import { waitFor } from "@testing-library/react-native";
import type { AssertionStepDefinitionDict, Locator } from "@siheom/core";
import { expect } from "vitest";
import { getA11ySnapshot } from "./getA11ySnapshot.js";
import { getElement, getElements } from "./query.js";

type DefaultAssertionsOptions = {
  resolveElement?: "sync" | "waitFor";
};

export function createDefaultAssertions(options: DefaultAssertionsOptions = {}) {
  const resolveElement = options.resolveElement ?? "waitFor";

  async function withPresentElement(
    target: Locator,
    assertMatch: (element: ReturnType<typeof getElement>) => void | Promise<void>,
  ) {
    if (resolveElement === "sync") {
      const element = getElement(target, true);
      expect(element).toBeOnTheScreen();
      await assertMatch(element);
      return;
    }

    await waitFor(async () => {
      const element = getElement(target, true);
      expect(element).toBeOnTheScreen();
      await assertMatch(element);
    });
  }

  async function withOptionalElement(
    target: Locator,
    flag: boolean,
    assertMatch: (element: ReturnType<typeof getElement> | null, flag: boolean) => void,
  ) {
    if (resolveElement === "sync") {
      const element = flag ? getElement(target, true) : getElement(target, false);
      if (flag) {
        expect(element).toBeOnTheScreen();
      }
      assertMatch(element, flag);
      return;
    }

    await waitFor(async () => {
      const element = flag ? getElement(target, true) : getElement(target, false);
      if (flag) {
        expect(element).toBeOnTheScreen();
      }
      assertMatch(element, flag);
    });
  }

  return {
    visible: async (target: Locator, flag = true) =>
      withOptionalElement(target, flag, (element, flag) => {
        if (flag) {
          expect(element).toBeOnTheScreen();
          return;
        }
        expect(element).not.toBeOnTheScreen();
      }),
    checked: async (target: Locator, flag = true) =>
      withPresentElement(target, (element) => {
        if (flag) {
          expect(element).toBeChecked();
          return;
        }
        expect(element).not.toBeChecked();
      }),
    expanded: async (target: Locator, flag = true) =>
      withPresentElement(target, (element) => {
        if (flag) {
          expect(element).toBeExpanded();
          return;
        }
        expect(element).toBeCollapsed();
      }),
    selected: async (target: Locator, flag = true) =>
      withPresentElement(target, (element) => {
        if (flag) {
          expect(element).toBeSelected();
          return;
        }
        expect(element).not.toBeSelected();
      }),
    disabled: async (target: Locator, flag = true) =>
      withPresentElement(target, (element) => {
        if (flag) {
          expect(element).toBeDisabled();
          return;
        }
        expect(element).not.toBeDisabled();
      }),
    focused: async (_target: Locator, _flag = true) => {
      throw new Error("focused is not supported in React Native");
    },
    current: async (_target: Locator, _expected: string, _flag = true) => {
      throw new Error("current is not supported in React Native");
    },
    count: async (target: Locator, expected: number, flag = true) => {
      const elements = getElements(target, true);
      if (flag) {
        expect(elements).toHaveLength(expected);
        return;
      }
      expect(elements.length).not.toBe(expected);
    },
    value: async (target: Locator, expected: string, flag = true) =>
      withPresentElement(target, (element) => {
        if (flag) {
          expect(element).toHaveDisplayValue(expected);
          return;
        }
        expect(element).not.toHaveDisplayValue(expected);
      }),
    href: async (_target: Locator, _expected: string, _flag = true) => {
      throw new Error("href is not supported in React Native");
    },
    errormessage: async (_target: Locator, _expected: string, _flag = true) => {
      throw new Error("errormessage is not supported in React Native");
    },
    description: async (_target: Locator, _expected: string, _flag = true) => {
      throw new Error("description is not supported in React Native");
    },
    textContent: async (target: Locator, expected: string, flag = true) =>
      withPresentElement(target, (element) => {
        if (flag) {
          expect(element).toHaveTextContent(expected);
          return;
        }
        expect(element).not.toHaveTextContent(expected);
      }),
    a11ySnapshot: async (target: Locator, path: string) =>
      withPresentElement(target, async (element) => {
        await expect(getA11ySnapshot(element)).toMatchFileSnapshot(path);
      }),
    tableSnapshot: async (_target: Locator, _path: string) => {
      throw new Error("tableSnapshot is not supported in React Native");
    },
  } satisfies AssertionStepDefinitionDict;
}

export const defaultAssertions = createDefaultAssertions();
