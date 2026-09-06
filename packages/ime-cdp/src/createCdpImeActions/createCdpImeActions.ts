import { type ActionStepDefinitionDict, type Locator } from "@siheom/core";
import { isEditable, planTypeImeSteps, withPresentElement } from "@siheom/ime";
import { userEvent } from "vitest/browser";

import { composeHangulCdp, type ComposeHangulCdpOptions } from "../composeHangulCdp/index.js";
import type { CdpSend } from "../cdpSession/index.js";

export type CreateCdpImeActionsOptions = {
  resolveElement?: "sync" | "waitFor";
  session?: CdpSend;
  commitFinal?: ComposeHangulCdpOptions["commitFinal"];
};

async function typeImeText(
  element: HTMLElement,
  text: string,
  composeOptions: Pick<ComposeHangulCdpOptions, "session" | "commitFinal">,
): Promise<void> {
  if (!isEditable(element)) {
    await userEvent.type(element, text);
    return;
  }

  for (const step of planTypeImeSteps(text)) {
    if (step.kind === "hangul") {
      await composeHangulCdp(element, step.text, {
        session: composeOptions.session,
        commitFinal: composeOptions.commitFinal ?? step.commitFinal,
      });
    } else {
      await userEvent.keyboard(step.text);
    }
  }
}

/**
 * Drop-in `fill` / `type` for `overrideSiheom({ actions: createCdpImeActions() })`.
 * Hangul runs use Chromium CDP composition; everything else uses Vitest browser `userEvent`.
 */
export function createCdpImeActions(options: CreateCdpImeActionsOptions = {}) {
  const resolveElement = options.resolveElement ?? "waitFor";
  const composeOptions = {
    session: options.session,
    commitFinal: options.commitFinal,
  };

  return {
    fill: async (target: Locator, text: string) =>
      withPresentElement(target, resolveElement, async (element) => {
        await userEvent.click(element);
        await userEvent.clear(element);
        await typeImeText(element, text, composeOptions);
      }),
    type: async (target: Locator, text: string) =>
      withPresentElement(target, resolveElement, async (element) => {
        await userEvent.click(element);
        await typeImeText(element, text, composeOptions);
      }),
  } satisfies Pick<ActionStepDefinitionDict, "fill" | "type">;
}

export type CdpImeActions = ReturnType<typeof createCdpImeActions>;
