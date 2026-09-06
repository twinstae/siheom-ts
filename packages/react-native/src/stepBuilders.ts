import type { Locator } from "@siheom/core";
import { locatorLog } from "./queryBuilders.js";

export const actions = {
  click: (target: Locator) =>
    ({
      action: "click",
      target,
      log: `click!      : ${locatorLog(target)}`,
    }) as const,
  dblclick: (target: Locator) =>
    ({
      action: "dblclick",
      target,
      log: `dblclick!   : ${locatorLog(target)}`,
    }) as const,
  hover: (target: Locator) =>
    ({
      action: "hover",
      target,
      log: `hover!      : ${locatorLog(target)}`,
    }) as const,
  fill: (target: Locator, text: string) =>
    ({
      action: "fill",
      target,
      args: [text],
      log: `fill!       : ${locatorLog(target)} with "${text}"`,
    }) as const,
  type: (target: Locator, text: string) =>
    ({
      action: "type",
      target,
      args: [text],
      log: `type!       : ${locatorLog(target)} with "${text}"`,
    }) as const,
  tab: (target: Locator) =>
    ({
      action: "tab",
      target,
      log: `tab!        : ${locatorLog(target)}`,
    }) as const,
  upload: (target: Locator, file: File) =>
    ({
      action: "upload",
      target,
      args: [file],
      log: `upload!     : ${locatorLog(target)} with "${file.name}"`,
    }) as const,
};

export const assertions = {
  visible: (target: Locator) =>
    ({
      assert: "visible",
      target,
      args: [true],
      log: `visible     : ${locatorLog(target)}`,
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
