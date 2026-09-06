import { waitFor } from "@testing-library/dom";
import { userEvent, type UserEvent } from "@testing-library/user-event";
import type { ActionStepDefinitionDict, Locator } from "./types.js";
import { dispatchDragAndDrop } from "./dispatchDragAndDrop.js";
import { getElement, locatorLog } from "./query.js";
import { expect } from "vitest";

type DefaultActionsOptions = {
  user?: UserEvent;
  /** Inside `withFakeTimers`, elements are resolved synchronously. */
  resolveElement?: "sync" | "waitFor";
};

export function createDefaultActions(options: DefaultActionsOptions = {}) {
  const user = options.user ?? userEvent.setup();
  const resolveElement = options.resolveElement ?? "waitFor";

  async function withPresentElement(target: Locator, run: (element: HTMLElement) => Promise<void>) {
    if (resolveElement === "sync") {
      const element = getElement(target, true);
      expect(element).toBeInTheDocument();
      await run(element);
      return;
    }

    await waitFor(async () => {
      const element = getElement(target, true);

      expect(element).toBeInTheDocument();
      await run(element);
    });
  }

  return {
    click: async (target: Locator) =>
      withPresentElement(target, async (element) => {
        await user.click(element);
      }),
    dblclick: async (target: Locator) =>
      withPresentElement(target, async (element) => {
        await user.dblClick(element);
      }),
    hover: async (target: Locator) =>
      withPresentElement(target, async (element) => {
        await user.hover(element);
      }),
    fill: async (target: Locator, text: string) =>
      withPresentElement(target, async (element) => {
        await user.click(element);
        await user.clear(element);
        await user.type(element, text);
      }),
    type: async (target: Locator, text: string) =>
      withPresentElement(target, async (element) => {
        await user.click(element);
        await user.type(element, text);
      }),
    tab: async (target: Locator) => {
      if (resolveElement === "sync") {
        const element = getElement(target, true);
        expect(element).toHaveFocus();
        await user.tab();
        await new Promise((resolve) => setTimeout(resolve, 300));
        return;
      }

      await waitFor(async () => {
        const element = getElement(target, true);

        expect(element).toHaveFocus();

        await user.tab();

        await new Promise((resolve) => setTimeout(resolve, 300));
      });
    },
    upload: async (target: Locator, file: File) =>
      withPresentElement(target, async (element) => {
        await user.upload(element, file);
      }),
    dragAndDrop: async (source: Locator, target: Locator) =>
      withPresentElement(source, async (sourceElement) => {
        const targetElement = getElement(target, true);
        expect(targetElement).toBeInTheDocument();
        dispatchDragAndDrop(sourceElement, targetElement);
      }),
  } satisfies ActionStepDefinitionDict;
}

export type DefaultActions = ReturnType<typeof createDefaultActions>;

export const defaultActions = createDefaultActions();

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
