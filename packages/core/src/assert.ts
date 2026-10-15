import { waitFor, within } from "@testing-library/dom";
import { computeAccessibleName } from "dom-accessibility-api";
import type { AssertionStepDefinitionDict, Locator } from "./types";
import { getElement, getElements, locatorLog } from "./query";
import { expect } from "vitest";
import { getA11ySnapshot } from "./getA11ySnapshot";
import { tableToMarkdown } from "./tableToMarkdown";

type DefaultAssertionsOptions = {
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

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const ITEM_ROLE_BY_CONTAINER_ROLE: Record<string, string> = {
  list: "listitem",
  listbox: "option",
  menu: "menuitem",
  tablist: "tab",
  radiogroup: "radio",
  table: "row",
  rowgroup: "row",
};

function getItemRole(containerRole: string): string {
  const itemRole = ITEM_ROLE_BY_CONTAINER_ROLE[containerRole];
  if (itemRole === undefined) {
    throw new Error(
      `${containerRole} is not a list-like container. Use one of: ${Object.keys(ITEM_ROLE_BY_CONTAINER_ROLE).join(", ")}`,
    );
  }
  return itemRole;
}

/** Items owned by `container`, excluding those of nested containers with the same role. */
function getDirectItems(container: HTMLElement, containerRole: string) {
  const itemRole = getItemRole(containerRole);
  const scope = within(container);
  const nestedContainers = scope.queryAllByRole(containerRole);
  return scope
    .queryAllByRole(itemRole)
    .filter((item) => !nestedContainers.some((nested) => nested.contains(item)));
}

function toTextMatcher(expected: string | RegExp): unknown {
  return typeof expected === "string" ? expected : expect.stringMatching(expected);
}

export function createDefaultAssertions(options: DefaultAssertionsOptions = {}) {
  const resolveElement = options.resolveElement ?? "waitFor";

  async function withPresentElement(target: Locator, assertMatch: (element: HTMLElement) => void) {
    if (resolveElement === "sync") {
      const element = getElement(target, true);
      expect(element).toBeInTheDocument();
      assertMatch(element);
      return;
    }

    await waitFor(async () => {
      const element = getElement(target, true);

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

  async function waitUntil(assertion: () => void | Promise<void>) {
    if (resolveElement === "sync") {
      await assertion();
      return;
    }

    await waitFor(assertion);
  }

  return {
    visible: async (target: Locator, expected: boolean) => {
      await waitUntil(async () => {
        const element = getElement(target, expected);

        if (expected) {
          expect(element).toBeInTheDocument();
          expect(element).not.toHaveAttribute("aria-hidden", "true");
          return;
        }

        if (element === null) {
          expect(element).not.toBeInTheDocument();
          return;
        }

        expect(element).not.toBeVisible();
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
          if (expected) {
            expect(element).toHaveAttribute("disabled");
          } else {
            expect(element).not.toHaveAttribute("disabled");
          }
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
        const elements = getElements(target, false);

        if (flag) {
          expect(elements).toHaveLength(expected);
        } else {
          expect(elements).not.toHaveLength(expected);
        }
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
    textContents: async (target: Locator, expected: readonly (string | RegExp)[]) =>
      withPresentElement(target, (element) => {
        const texts = getDirectItems(element, target.role).map((item) =>
          normalizeWhitespace(item.textContent ?? ""),
        );
        expect(texts).toEqual(expected.map(toTextMatcher));
      }),
    names: async (target: Locator, expected: readonly (string | RegExp)[]) =>
      withPresentElement(target, (element) => {
        const names = getDirectItems(element, target.role).map((item) =>
          computeAccessibleName(item),
        );
        expect(names).toEqual(expected.map(toTextMatcher));
      }),
    a11ySnapshot: async (target: Locator, path: string) => {
      await withPresentElement(target, () => {});

      await expect(getA11ySnapshot(getElement(target, true))).toMatchFileSnapshot(
        `__snapshots__/${path}`,
      );
    },
    tableSnapshot: async (target: Locator, path: string) => {
      await withPresentElement(target, (element) => {
        expect(element).toBeInstanceOf(HTMLTableElement);
      });

      await expect(
        tableToMarkdown(getElement(target, true) as HTMLTableElement),
      ).toMatchFileSnapshot(`__snapshots__/${path}`);
    },
  } satisfies AssertionStepDefinitionDict;
}

export type DefaultAssertions = ReturnType<typeof createDefaultAssertions>;

export const defaultAssertions = createDefaultAssertions();

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
  textContents: (target: Locator, expected: readonly (string | RegExp)[]) =>
    ({
      assert: "textContents",
      target,
      args: [expected],
      log: `textContents: ${locatorLog(target)} are [${expected.map(String).join(", ")}]`,
    }) as const,
  names: (target: Locator, expected: readonly (string | RegExp)[]) =>
    ({
      assert: "names",
      target,
      args: [expected],
      log: `names       : ${locatorLog(target)} are [${expected.map(String).join(", ")}]`,
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
