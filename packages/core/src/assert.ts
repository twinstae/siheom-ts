import { waitFor } from "@testing-library/dom";
import type { AssertionStepDefinitionDict, Locator } from "./types.js";
import { getElement, getElements, locatorLog } from "./query.js";
import type { A11ySnapshotOptions } from "./getA11ySnapshot.js";
import { expect } from "vitest";
import { getA11ySnapshot } from "./getA11ySnapshot.js";
import { tableToMarkdown } from "./tableToMarkdown.js";

type ResolveElementMode = "sync" | "waitFor";

type DefaultAssertionsOptions = {
  resolveElement?: ResolveElementMode;
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

function expectElementDisabled(element: HTMLElement, expected: boolean) {
  if (element.hasAttribute("disabled")) {
    if (expected) {
      expect(element).toHaveAttribute("disabled");
    } else {
      expect(element).not.toHaveAttribute("disabled");
    }
    return;
  }
  expect(element).toHaveAttribute("aria-disabled", expected ? "true" : "false");
}

function expectElementFocused(element: HTMLElement, expected: boolean) {
  if (expected) {
    expect(element).toHaveFocus();
  } else {
    expect(element).not.toHaveFocus();
  }
}

async function withPresentElement(
  mode: ResolveElementMode,
  target: Locator,
  assertMatch: (element: HTMLElement) => void,
) {
  if (mode === "sync") {
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

async function waitUntil(mode: ResolveElementMode, assertion: () => void | Promise<void>) {
  if (mode === "sync") {
    await assertion();
    return;
  }
  await waitFor(assertion);
}

async function assertAttributeWhen(
  mode: ResolveElementMode,
  target: Locator,
  flag: boolean,
  positive: (element: HTMLElement) => void,
  negative: (element: HTMLElement) => void,
) {
  await withPresentElement(mode, target, (element) => {
    if (flag) {
      positive(element);
      return;
    }
    negative(element);
  });
}

async function assertVisible(mode: ResolveElementMode, target: Locator, expected: boolean) {
  await waitUntil(mode, async () => {
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

    expect(element).not.toHaveAttribute("aria-hidden", "false");
  });
}

async function assertCount(
  mode: ResolveElementMode,
  target: Locator,
  expected: number,
  flag: boolean,
) {
  await waitUntil(mode, async () => {
    const elements = getElements(target, true);
    if (flag) {
      expect(elements).toHaveLength(expected);
    } else {
      expect(elements).not.toHaveLength(expected);
    }
  });
}

async function assertA11ySnapshot(
  mode: ResolveElementMode,
  target: Locator,
  path: string,
  options?: A11ySnapshotOptions,
) {
  await withPresentElement(mode, target, () => {});
  await expect(getA11ySnapshot(getElement(target, true), options)).toMatchFileSnapshot(
    `__snapshots__/${path}`,
  );
}

async function assertTableSnapshot(mode: ResolveElementMode, target: Locator, path: string) {
  await withPresentElement(mode, target, (element) => {
    expect(element).toBeInstanceOf(HTMLTableElement);
  });
  await expect(tableToMarkdown(getElement(target, true) as HTMLTableElement)).toMatchFileSnapshot(
    `__snapshots__/${path}`,
  );
}

async function assertChecked(mode: ResolveElementMode, target: Locator, expected: boolean) {
  await withPresentElement(mode, target, (element) => expectElementChecked(element, expected));
}

async function assertExpanded(mode: ResolveElementMode, target: Locator, expected: boolean) {
  await withPresentElement(mode, target, (element) => {
    expect(element).toHaveAttribute("aria-expanded", expected ? "true" : "false");
  });
}

async function assertSelected(mode: ResolveElementMode, target: Locator, expected: boolean) {
  await withPresentElement(mode, target, (element) => {
    expect(element).toHaveAttribute("aria-selected", expected ? "true" : "false");
  });
}

async function assertDisabled(mode: ResolveElementMode, target: Locator, expected: boolean) {
  await withPresentElement(mode, target, (element) => expectElementDisabled(element, expected));
}

async function assertFocused(mode: ResolveElementMode, target: Locator, expected: boolean) {
  await withPresentElement(mode, target, (element) => expectElementFocused(element, expected));
}

async function assertCurrent(
  mode: ResolveElementMode,
  target: Locator,
  expected: "true" | "false" | "page" | "step" | "location" | "date" | "time",
  flag: boolean,
) {
  await assertAttributeWhen(
    mode,
    target,
    flag,
    (element) => expect(element).toHaveAttribute("aria-current", expected),
    (element) => expect(element).not.toHaveAttribute("aria-current", expected),
  );
}

async function assertValue(
  mode: ResolveElementMode,
  target: Locator,
  expected: string,
  flag: boolean,
) {
  await assertAttributeWhen(
    mode,
    target,
    flag,
    (element) => expect(element).toHaveValue(expected),
    (element) => expect(element).not.toHaveValue(expected),
  );
}

async function assertHref(
  mode: ResolveElementMode,
  target: Locator,
  expected: string,
  flag: boolean,
) {
  await assertAttributeWhen(
    mode,
    target,
    flag,
    (element) => expect(element).toHaveAttribute("href", expected),
    (element) => expect(element).not.toHaveAttribute("href", expected),
  );
}

async function assertErrormessage(
  mode: ResolveElementMode,
  target: Locator,
  expected: string,
  flag: boolean,
) {
  await assertAttributeWhen(
    mode,
    target,
    flag,
    (element) => expect(element).toHaveAccessibleErrorMessage(expected),
    (element) => expect(element).not.toHaveAccessibleErrorMessage(expected),
  );
}

async function assertDescription(mode: ResolveElementMode, target: Locator, expected: string) {
  await withPresentElement(mode, target, (element) => {
    expect(element).toHaveAccessibleDescription(expected);
  });
}

async function assertTextContent(
  mode: ResolveElementMode,
  target: Locator,
  expected: string,
  flag: boolean,
) {
  await assertAttributeWhen(
    mode,
    target,
    flag,
    (element) => expect(element).toHaveTextContent(expected),
    (element) => expect(element).not.toHaveTextContent(expected),
  );
}

export function createDefaultAssertions(options: DefaultAssertionsOptions = {}) {
  const mode = options.resolveElement ?? "waitFor";

  return {
    visible: (target: Locator, expected: boolean) => assertVisible(mode, target, expected),
    checked: (target: Locator, expected: boolean) => assertChecked(mode, target, expected),
    expanded: (target: Locator, expected: boolean) => assertExpanded(mode, target, expected),
    selected: (target: Locator, expected: boolean) => assertSelected(mode, target, expected),
    disabled: (target: Locator, expected: boolean) => assertDisabled(mode, target, expected),
    focused: (target: Locator, expected: boolean) => assertFocused(mode, target, expected),
    current: (
      target: Locator,
      expected: "true" | "false" | "page" | "step" | "location" | "date" | "time",
      flag = true,
    ) => assertCurrent(mode, target, expected, flag),
    count: (target: Locator, expected: number, flag = true) =>
      assertCount(mode, target, expected, flag),
    value: (target: Locator, expected: string, flag = true) =>
      assertValue(mode, target, expected, flag),
    href: (target: Locator, expected: string, flag = true) =>
      assertHref(mode, target, expected, flag),
    errormessage: (target: Locator, expected: string, flag = true) =>
      assertErrormessage(mode, target, expected, flag),
    description: (target: Locator, expected: string) => assertDescription(mode, target, expected),
    textContent: (target: Locator, expected: string, flag = true) =>
      assertTextContent(mode, target, expected, flag),
    a11ySnapshot: (target: Locator, path: string, options?: A11ySnapshotOptions) =>
      assertA11ySnapshot(mode, target, path, options),
    tableSnapshot: (target: Locator, path: string) => assertTableSnapshot(mode, target, path),
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
  a11ySnapshot: (target: Locator, path: string, options?: A11ySnapshotOptions) =>
    ({
      assert: "a11ySnapshot",
      target,
      args: options === undefined ? [path] : [path, options],
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
