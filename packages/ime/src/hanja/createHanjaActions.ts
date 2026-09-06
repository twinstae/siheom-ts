import { userEvent, type UserEvent } from "@testing-library/user-event";
import { type ActionStepDefinitionDict, type Locator } from "@siheom/core";

import { resolveProfile, type ImeProfile } from "../profiles/index.js";
import { withPresentElement } from "../withPresentElement/index.js";
import { typeHanja } from "./typeHanja.js";

export type CreateHanjaActionsOptions = {
  user?: UserEvent;
  resolveElement?: "sync" | "waitFor";
  profile?: string | ImeProfile;
};

function assertEditableTextControl(
  element: HTMLElement,
): asserts element is HTMLInputElement | HTMLTextAreaElement {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error("typeHanja requires an input or textarea");
  }
}

async function typeHanjaOnPresentElement(
  user: UserEvent,
  element: HTMLElement,
  hanja: string,
  hangul: string,
  profile: ImeProfile,
): Promise<void> {
  assertEditableTextControl(element);
  await user.click(element);
  await typeHanja(element, hanja, hangul, { profile });
}

/**
 * Siheom action registry for Hanja conversion.
 * Use with `extendSiheom(base, { actions: createHanjaActions() })` then
 * `actions.typeHanja(query.combobox("검색"), "金泰熙", "김태희")`.
 */
export function createHanjaActions(options: CreateHanjaActionsOptions = {}) {
  const user = options.user ?? userEvent.setup();
  const resolveElement = options.resolveElement ?? "waitFor";
  const profile = resolveProfile(options.profile);

  return {
    typeHanja: (target: Locator, hanja: string, hangul: string) =>
      withPresentElement(target, resolveElement, (element) =>
        typeHanjaOnPresentElement(user, element, hanja, hangul, profile),
      ),
  } satisfies ActionStepDefinitionDict;
}

export type HanjaActions = ReturnType<typeof createHanjaActions>;
