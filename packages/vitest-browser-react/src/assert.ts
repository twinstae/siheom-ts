import type { AssertionStepDefinitionDict, Locator } from "@siheom/core";
import { getA11ySnapshot, locatorLog, tableToMarkdown } from "@siheom/core";
import { expect } from "vitest";
import {
  getElementFromLocator,
  getElementsFromLocator,
  toBrowserLocator,
} from "./browserLocator.js";

type BrowserAssertionsOptions = {
  resolveElement?: "sync" | "waitFor";
};

function expectElementChecked(element: HTMLElement, expected: boolean) {
  if (
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" || element.type === "radio")
  ) {
    if (expected) {
      expect(element).toBeChecked();
    } else {
      expect(element).not.toBeChecked();
    }
    return;
  }

  if (expected) {
    expect(element).toHaveAttribute("aria-checked", "true");
  } else {
    expect(element).not.toHaveAttribute("aria-checked", "true");
  }
}

export function createBrowserAssertions(options: BrowserAssertionsOptions = {}) {
  const resolveElement = options.resolveElement ?? "waitFor";

  async function waitUntil(assertion: () => void | Promise<void>) {
    if (resolveElement === "sync") {
      await assertion();
      return;
    }

    await expect.poll(assertion).toBeUndefined();
  }

  async function withPresentElement(target: Locator, assertMatch: (element: HTMLElement) => void) {
    await waitUntil(async () => {
      const element = getElementFromLocator(target, resolveElement === "sync");
      expect(element).toBeInTheDocument();
      assertMatch(element);
    });
  }

  async function withPresentElementFlag(
    target: Locator,
    flag: boolean,
    assertMatch: (element: HTMLElement, flag: boolean) => void,
  ) {
    await withPresentElement(target, (element) => assertMatch(element, flag));
  }

  function assertAttributeWhen(
    target: Locator,
    flag: boolean,
    positive: (element: HTMLElement) => void,
    negative: (element: HTMLElement) => void,
  ) {
    return withPresentElementFlag(target, flag, (element, flag) => {
      if (flag) {
        positive(element);
        return;
      }
      negative(element);
    });
  }

  return {
    visible: async (target: Locator, expected: boolean) => {
      await waitUntil(async () => {
        const browserLocator = toBrowserLocator(target);
        const element =
          resolveElement === "sync" ? browserLocator.element() : browserLocator.query();

        if (expected) {
          const resolved = element ?? browserLocator.element();
          expect(resolved).toBeInTheDocument();
          expect(resolved).not.toHaveAttribute("aria-hidden", "true");
          return;
        }

        if (element === null) {
          expect(element).not.toBeInTheDocument();
          return;
        }

        expect(element).not.toHaveAttribute("aria-hidden", "false");
      });
    },
    checked: async (target: Locator, expected: boolean) =>
      withPresentElement(target, (element) => {
        expectElementChecked(element, expected);
      }),
    expanded: async (target: Locator, expected: boolean) =>
      withPresentElement(target, (element) => {
        expect(element).toHaveAttribute("aria-expanded", expected ? "true" : "false");
      }),
    selected: async (target: Locator, expected: boolean) =>
      withPresentElement(target, (element) => {
        expect(element).toHaveAttribute("aria-selected", expected ? "true" : "false");
      }),
    disabled: async (target: Locator, expected: boolean) =>
      withPresentElement(target, (element) => {
        if (element.hasAttribute("disabled")) {
          expect(element).toHaveAttribute("disabled", expected ? "disabled" : null);
          return;
        }

        expect(element).toHaveAttribute("aria-disabled", expected ? "true" : "false");
      }),
    focused: async (target: Locator, expected: boolean) =>
      withPresentElement(target, (element) => {
        if (expected) {
          expect(element).toHaveFocus();
        } else {
          expect(element).not.toHaveFocus();
        }
      }),
    current: async (
      target: Locator,
      expected: "true" | "false" | "page" | "step" | "location" | "date" | "time",
      flag = true,
    ) =>
      assertAttributeWhen(
        target,
        flag,
        (element) => expect(element).toHaveAttribute("aria-current", expected),
        (element) => expect(element).not.toHaveAttribute("aria-current", expected),
      ),
    count: async (target: Locator, expected: number, flag = true) => {
      await waitUntil(async () => {
        const elements = getElementsFromLocator(target, resolveElement === "sync");
        if (flag) {
          expect(elements).toHaveLength(expected);
          return;
        }
        expect(elements).not.toHaveLength(expected);
      });
    },
    value: async (target: Locator, expected: string, flag = true) =>
      assertAttributeWhen(
        target,
        flag,
        (element) => expect(element).toHaveValue(expected),
        (element) => expect(element).not.toHaveValue(expected),
      ),
    href: async (target: Locator, expected: string, flag = true) =>
      assertAttributeWhen(
        target,
        flag,
        (element) => expect(element).toHaveAttribute("href", expected),
        (element) => expect(element).not.toHaveAttribute("href", expected),
      ),
    errormessage: async (target: Locator, expected: string, flag = true) =>
      assertAttributeWhen(
        target,
        flag,
        (element) => expect(element).toHaveAccessibleErrorMessage(expected),
        (element) => expect(element).not.toHaveAccessibleErrorMessage(expected),
      ),
    description: async (target: Locator, expected: string) =>
      withPresentElement(target, (element) => {
        expect(element).toHaveAccessibleDescription(expected);
      }),
    textContent: async (target: Locator, expected: string, flag = true) =>
      assertAttributeWhen(
        target,
        flag,
        (element) => expect(element).toHaveTextContent(expected),
        (element) => expect(element).not.toHaveTextContent(expected),
      ),
    a11ySnapshot: async (target: Locator, path: string) => {
      await withPresentElement(target, () => {});
      const element = getElementFromLocator(target, true);
      await expect(getA11ySnapshot(element)).toMatchFileSnapshot(`__snapshots__/${path}`);
    },
    tableSnapshot: async (target: Locator, path: string) => {
      await withPresentElement(target, (element) => {
        expect(element).toBeInstanceOf(HTMLTableElement);
      });
      const element = getElementFromLocator(target, true);
      await expect(tableToMarkdown(element as HTMLTableElement)).toMatchFileSnapshot(
        `__snapshots__/${path}`,
      );
    },
  } satisfies AssertionStepDefinitionDict;
}

export const defaultBrowserAssertions = createBrowserAssertions();

export const assertions = {
  description: (target: Locator, expected: string) =>
    ({
      assert: "description",
      target,
      args: [expected],
      log: `description: ${target.role} "${target.name}" is "${expected}"`,
    }) as const,
  visible: (target: Locator) =>
    ({
      assert: "visible",
      target,
      args: [true],
      log: `visible     : ${target.role} "${target.name}"`,
    }) as const,
  checked: (target: Locator) =>
    ({
      assert: "checked",
      target,
      args: [true],
      log: `checked     : ${locatorLog(target)}`,
    }) as const,
  expanded: (target: Locator) =>
    ({
      assert: "expanded",
      target,
      args: [true],
      log: `expanded    : ${locatorLog(target)}`,
    }) as const,
  selected: (target: Locator) =>
    ({
      assert: "selected",
      target,
      args: [true],
      log: `selected    : ${locatorLog(target)}`,
    }) as const,
  disabled: (target: Locator) =>
    ({
      assert: "disabled",
      target,
      args: [true],
      log: `disabled    : ${locatorLog(target)}`,
    }) as const,
  focused: (target: Locator) =>
    ({
      assert: "focused",
      target,
      args: [true],
      log: `focused     : ${locatorLog(target)}`,
    }) as const,
  current: (
    target: Locator,
    expected: "true" | "false" | "page" | "step" | "location" | "date" | "time",
  ) =>
    ({
      assert: "current",
      target,
      args: [expected, true],
      log: `current     : ${locatorLog(target)} is "${expected}"`,
    }) as const,
  count: (target: Locator, expected: number) =>
    ({
      assert: "count",
      target,
      args: [expected, true],
      log: `count       : ${locatorLog(target)} is ${expected}`,
    }) as const,
  value: (target: Locator, expected: string) =>
    ({
      assert: "value",
      target,
      args: [expected, true],
      log: `value       : ${locatorLog(target)} is "${expected}"`,
    }) as const,
  href: (target: Locator, expected: string) =>
    ({
      assert: "href",
      target,
      args: [expected, true],
      log: `href        : ${locatorLog(target)} is "${expected}"`,
    }) as const,
  errormessage: (target: Locator, expected: string) =>
    ({
      assert: "errormessage",
      target,
      args: [expected, true],
      log: `${target.role} ${target.name}의 에러 메시지는 "${expected}" 이다.`,
    }) as const,
  textContent: (target: Locator, expected: string) =>
    ({
      assert: "textContent",
      target,
      args: [expected, true],
      log: `textContent : ${locatorLog(target)} is "${expected}"`,
    }) as const,
  not: {
    visible: (target: Locator) =>
      ({
        assert: "visible",
        target,
        args: [false],
        log: `not visible: ${target.role} "${target.name}"`,
      }) as const,
    checked: (target: Locator) =>
      ({
        assert: "checked",
        target,
        args: [false],
        log: `not checked : ${locatorLog(target)}`,
      }) as const,
    expanded: (target: Locator) =>
      ({
        assert: "expanded",
        target,
        args: [false],
        log: `not expanded: ${locatorLog(target)}`,
      }) as const,
    selected: (target: Locator) =>
      ({
        assert: "selected",
        target,
        args: [false],
        log: `not selected: ${locatorLog(target)}`,
      }) as const,
    disabled: (target: Locator) =>
      ({
        assert: "disabled",
        target,
        args: [false],
        log: `not disabled: ${locatorLog(target)}`,
      }) as const,
    focused: (target: Locator) =>
      ({
        assert: "focused",
        target,
        args: [false],
        log: `not focused : ${locatorLog(target)}`,
      }) as const,
    current: (
      target: Locator,
      expected: "true" | "false" | "page" | "step" | "location" | "date" | "time",
    ) =>
      ({
        assert: "current",
        target,
        args: [expected, false],
        log: `not current : ${locatorLog(target)} is not "${expected}"`,
      }) as const,
    count: (target: Locator, expected: number) =>
      ({
        assert: "count",
        target,
        args: [expected, false],
        log: `not count   : ${locatorLog(target)} is not ${expected}`,
      }) as const,
    value: (target: Locator, expected: string) =>
      ({
        assert: "value",
        target,
        args: [expected, false],
        log: `not value   : ${locatorLog(target)} is not "${expected}"`,
      }) as const,
    href: (target: Locator, expected: string) =>
      ({
        assert: "href",
        target,
        args: [expected, false],
        log: `not href    : ${locatorLog(target)} is not "${expected}"`,
      }) as const,
    errormessage: (target: Locator, expected: string) =>
      ({
        assert: "errormessage",
        target,
        args: [expected, false],
        log: `not errormessage: ${locatorLog(target)} is not "${expected}"`,
      }) as const,
    textContent: (target: Locator, expected: string) =>
      ({
        assert: "textContent",
        target,
        args: [expected, false],
        log: `not textContent: ${locatorLog(target)} is not "${expected}"`,
      }) as const,
  },
  a11ySnapshot: (target: Locator, path: string) =>
    ({
      assert: "a11ySnapshot",
      target,
      args: [path],
      log: `a11ySnapshot!: ${locatorLog(target)}`,
    }) as const,
  tableSnapshot: (target: Locator, path: string) =>
    ({
      assert: "tableSnapshot",
      target,
      args: [path],
      log: `tableSnapshot!: ${locatorLog(target)}`,
    }) as const,
};
