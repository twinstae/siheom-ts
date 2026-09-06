import { page, userEvent, type Locator as BrowserLocator } from "vitest/browser";
import { dispatchDragAndDrop, locatorLog } from "@siheom/core";
import type { ActionStepDefinitionDict, Locator } from "@siheom/core";
import { expect } from "vitest";
import { getElementFromLocator, toBrowserLocator } from "./browserLocator.js";

type BrowserActionsOptions = {
  resolveElement?: "sync" | "waitFor";
};

function hasUserEventKeys(text: string): boolean {
  return /[{][^}]+[}]/.test(text);
}

function isCheckboxOrRadioTarget(target: Locator): boolean {
  return target.role === "checkbox" || target.role === "radio";
}

/** True when Playwright can realistically pointer-click this element. */
function isPointerInteractable(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    return false;
  }

  const style = getComputedStyle(element);
  if (
    style.visibility === "hidden" ||
    style.display === "none" ||
    style.pointerEvents === "none" ||
    Number.parseFloat(style.opacity) === 0
  ) {
    return false;
  }

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) {
    return false;
  }

  const top = document.elementFromPoint(cx, cy);
  if (!top) {
    return false;
  }

  return top === element || element.contains(top);
}

/**
 * Resolve the label associated with a control via:
 * - `HTMLElement.labels` (`for` / wrapping `<label>`)
 * - `aria-labelledby`
 * - nearest ancestor `<label>`
 */
function getAssociatedLabelElement(element: Element): HTMLElement | null {
  if (element instanceof HTMLElement && "labels" in element) {
    const labels = (element as HTMLInputElement).labels;
    if (labels && labels.length > 0) {
      return labels[0]!;
    }
  }

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    for (const id of labelledBy.trim().split(/\s+/)) {
      if (!id) continue;
      const ref = document.getElementById(id);
      if (ref instanceof HTMLElement) {
        return ref;
      }
    }
  }

  const closestLabel = element.closest("label");
  if (closestLabel instanceof HTMLLabelElement) {
    return closestLabel;
  }

  return null;
}

/**
 * Headless UI often exposes role=checkbox on a HiddenInput (Ark) or a covered
 * native input (React Aria). Playwright refuses those pointer targets; click the
 * associated label instead (same control the a11y name came from).
 */
async function clickCheckboxOrRadio(target: Locator, locator: BrowserLocator) {
  const element = locator.query() ?? locator.element();
  if (isPointerInteractable(element)) {
    await locator.click();
    return;
  }

  const label = getAssociatedLabelElement(element);
  if (!label) {
    throw new Error(
      `Cannot click ${locatorLog(target)}: control is not pointer-interactable and has no associated label (for / aria-labelledby)`,
    );
  }

  await page.elementLocator(label).click();
}

export function createBrowserActions(
  options: BrowserActionsOptions = {},
): ActionStepDefinitionDict {
  const resolveElement = options.resolveElement ?? "waitFor";

  async function withPresentLocator(
    target: Locator,
    run: (locator: ReturnType<typeof toBrowserLocator>) => Promise<void>,
  ) {
    const locator = toBrowserLocator(target);

    if (resolveElement === "sync") {
      locator.element();
      await run(locator);
      return;
    }

    await run(locator);
  }

  return {
    click: async (target: Locator) =>
      withPresentLocator(target, async (locator) => {
        if (isCheckboxOrRadioTarget(target)) {
          await clickCheckboxOrRadio(target, locator);
          return;
        }

        await locator.click();
      }),
    dblclick: async (target: Locator) =>
      withPresentLocator(target, async (locator) => {
        await locator.dblClick();
      }),
    hover: async (target: Locator) =>
      withPresentLocator(target, async (locator) => {
        await locator.hover();
      }),
    fill: async (target: Locator, text: string) =>
      withPresentLocator(target, async (locator) => {
        if (hasUserEventKeys(text)) {
          await userEvent.click(locator);
          await userEvent.clear(locator);
          await userEvent.type(locator, text);
          return;
        }

        await locator.fill(text);
      }),
    type: async (target: Locator, text: string) =>
      withPresentLocator(target, async (locator) => {
        await userEvent.click(locator);
        await userEvent.type(locator, text);
      }),
    tab: async (target: Locator) => {
      if (resolveElement === "sync") {
        expect(getElementFromLocator(target, true)).toHaveFocus();
        await userEvent.tab();
        await new Promise((resolve) => setTimeout(resolve, 300));
        return;
      }

      await expect
        .poll(() => {
          expect(getElementFromLocator(target, true)).toHaveFocus();
        })
        .toBeUndefined();
      await userEvent.tab();
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
    upload: async (target: Locator, file: File) =>
      withPresentLocator(target, async (locator) => {
        await locator.upload(file);
      }),
    dragAndDrop: async (source: Locator, target: Locator) =>
      withPresentLocator(source, async () => {
        const sourceElement = getElementFromLocator(source, resolveElement === "sync");
        const targetElement = getElementFromLocator(target, resolveElement === "sync");
        dispatchDragAndDrop(sourceElement, targetElement);
      }),
  };
}

export const defaultBrowserActions = createBrowserActions();

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
  dragAndDrop: (source: Locator, target: Locator) =>
    ({
      action: "dragAndDrop",
      target: source,
      args: [target],
      log: `dragAndDrop! : ${locatorLog(source)} → ${locatorLog(target)}`,
    }) as const,
};
