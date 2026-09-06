import { userEvent, type UserEvent } from "@testing-library/user-event";
import { type ActionStepDefinitionDict, type Locator } from "@siheom/core";

import { composeArrowLeft } from "../composeArrowLeft/index.js";
import { composeBackspace } from "../composeBackspace/index.js";
import { composeEnter } from "../composeEnter/index.js";
import { composeHangul, type ComposeHangulOptions } from "../composeHangul/index.js";
import { composeHangulContentEditableFirefoxBrokenOn } from "../composeHangul/composeHangulContentEditableFirefoxBroken.js";
import { composeHangulContentEditableFirefoxFixedOn } from "../composeHangul/composeHangulContentEditableFirefoxFixed.js";
import { composeHangulContentEditableAndroidFirefoxFixedOn } from "../composeHangul/composeHangulContentEditableAndroidFirefoxFixed.js";
import { composeHangulAndroidChromeSlatePlaceholderBrokenOn } from "../composeHangul/composeHangulAndroidChromeSlatePlaceholderBroken.js";
import { composeHangulAndroidFirefoxSlatePlaceholderBrokenOn } from "../composeHangul/composeHangulAndroidFirefoxSlatePlaceholderBroken.js";
import { composeHangulAndroidFirefoxSlatePlaceholderFixedOn } from "../composeHangul/composeHangulAndroidFirefoxSlatePlaceholderFixed.js";
import {
  composeHangulLinuxChromeSlatePlaceholderFixedOn,
  composeHangulLinuxFirefoxSlatePlaceholderFixedOn,
} from "../composeHangul/composeHangulLinuxSlateGolden.js";
import { planTypeImeSteps, type TypeImeStep } from "../planTypeImeSteps/index.js";
import { resolveProfile, type HangulComposeMode, type ImeProfile } from "../profiles/index.js";
import { isContentEditableComposeTarget } from "../_internal/editableElement.js";
import { isEditable, withPresentElement } from "../withPresentElement/index.js";

export type CreateImeActionsOptions = {
  user?: UserEvent;
  resolveElement?: "sync" | "waitFor";
  /** Profile id, profile object, or env `SIHEOM_IME_PROFILE` / default linux-chrome-ibus-hangul */
  profile?: string | ImeProfile;
  /** Passed through to `composeHangul` (e.g. stale controlled-input races). */
  settle?: ComposeHangulOptions["settle"];
  deferredUpdateRace?: ComposeHangulOptions["deferredUpdateRace"];
};

type HangulStepPlayer = (
  element: HTMLElement,
  step: Extract<TypeImeStep, { kind: "hangul" }>,
) => Promise<unknown>;

async function composeSpecialKeyName(
  element: HTMLInputElement | HTMLTextAreaElement,
  name: string,
  profile: ImeProfile,
  user: UserEvent,
): Promise<void> {
  if (/^Backspace$/i.test(name)) {
    await composeBackspace(element, profile);
    return;
  }
  if (/^ArrowLeft$/i.test(name)) {
    await composeArrowLeft(element, profile);
    return;
  }
  if (/^Enter$/i.test(name)) {
    await composeEnter(element, profile);
    return;
  }
  await user.keyboard(`{${name}}`);
}

/** Parse `{Name}`; unclosed `{` returns the rest of the string as keyboard text. */
function braceTokenEnd(text: string, start: number): { end: number; name: string | null } {
  const close = text.indexOf("}", start + 1);
  if (close === -1) return { end: text.length, name: null };
  return { end: close + 1, name: text.slice(start + 1, close) };
}

function plainKeyboardRunEnd(text: string, start: number): number {
  let end = start + 1;
  while (end < text.length && text[end] !== "{") end++;
  return end;
}

async function typeKeySegment(
  user: UserEvent,
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  profile: ImeProfile,
): Promise<void> {
  let index = 0;
  while (index < text.length) {
    if (text[index] === "{") {
      const token = braceTokenEnd(text, index);
      if (token.name === null) {
        await user.keyboard(text.slice(index));
        return;
      }
      await composeSpecialKeyName(element, token.name, profile, user);
      index = token.end;
      continue;
    }
    const end = plainKeyboardRunEnd(text, index);
    await user.keyboard(text.slice(index, end));
    index = end;
  }
}

async function typeNonHangulStep(
  user: UserEvent,
  element: HTMLElement,
  text: string,
  profile: ImeProfile,
): Promise<void> {
  if (isEditable(element)) {
    await typeKeySegment(user, element, text, profile);
    return;
  }
  await user.type(element, text);
}

async function playPlannedImeSteps(
  user: UserEvent,
  element: HTMLElement,
  text: string,
  profile: ImeProfile,
  playHangul: HangulStepPlayer,
): Promise<void> {
  for (const step of planTypeImeSteps(text)) {
    if (step.kind === "hangul") {
      await playHangul(element, step);
      continue;
    }
    await typeNonHangulStep(user, element, step.text, profile);
  }
}

function defaultComposeHangulPlayer(
  profile: ImeProfile,
  composeOptions: Pick<ComposeHangulOptions, "settle" | "deferredUpdateRace">,
): HangulStepPlayer {
  return async (element, step) => {
    if (!isEditable(element)) {
      throw new Error("composeHangul requires an input or textarea");
    }
    await composeHangul(element, step.text, {
      commitFinal: step.commitFinal,
      profile,
      ...composeOptions,
    });
  };
}

type ContentEditableHangulPlayer = (
  element: HTMLElement,
  text: string,
  step: Extract<TypeImeStep, { kind: "hangul" }>,
  profile: ImeProfile,
) => Promise<unknown>;

const CONTENT_EDITABLE_HANGUL_PLAYERS = {
  "contenteditable-firefox-broken": (element, _text, step) =>
    composeHangulContentEditableFirefoxBrokenOn(element, step.text, {
      commitFinal: step.commitFinal,
    }),
  "contenteditable-firefox-fixed": (element, _text, step, profile) =>
    composeHangulContentEditableFirefoxFixedOn(element, step.text, {
      commitFinal: step.commitFinal,
      profile,
    }),
  "contenteditable-firefox-af-fixed": (element, _text, step) =>
    composeHangulContentEditableAndroidFirefoxFixedOn(element, step.text),
  "android-chrome-slate-placeholder-broken": (element, _text, step) =>
    composeHangulAndroidChromeSlatePlaceholderBrokenOn(element, step.text),
  "android-firefox-slate-placeholder-broken": (element, _text, step) =>
    composeHangulAndroidFirefoxSlatePlaceholderBrokenOn(element, step.text),
  "android-firefox-slate-placeholder-fixed": (element, _text, step) =>
    composeHangulAndroidFirefoxSlatePlaceholderFixedOn(element, step.text),
  "linux-chrome-slate-placeholder-fixed": (element, _text, step) =>
    composeHangulLinuxChromeSlatePlaceholderFixedOn(element, step.text),
  "linux-firefox-slate-placeholder-fixed": (element, _text, step) =>
    composeHangulLinuxFirefoxSlatePlaceholderFixedOn(element, step.text),
} as const satisfies Partial<Record<HangulComposeMode, ContentEditableHangulPlayer>>;

const PLAIN_COMPOSE_MODES = new Set<HangulComposeMode>([
  "linux-chrome-slate-plain-control",
  "linux-firefox-slate-plain-control",
  "android-firefox-slate-plain-control",
  "android-chrome-slate-plain-control",
]);

function isPlainComposeMode(mode: HangulComposeMode): boolean {
  return PLAIN_COMPOSE_MODES.has(mode);
}

async function typeImeText(
  user: UserEvent,
  element: HTMLElement,
  text: string,
  profile: ImeProfile,
  composeOptions: Pick<ComposeHangulOptions, "settle" | "deferredUpdateRace">,
): Promise<void> {
  const cePlayer =
    CONTENT_EDITABLE_HANGUL_PLAYERS[
      profile.hangulComposeMode as keyof typeof CONTENT_EDITABLE_HANGUL_PLAYERS
    ];
  if (cePlayer && isContentEditableComposeTarget(element)) {
    await playPlannedImeSteps(user, element, text, profile, (el, step) =>
      cePlayer(el, text, step, profile),
    );
    return;
  }

  if (isPlainComposeMode(profile.hangulComposeMode) && isEditable(element)) {
    await playPlannedImeSteps(
      user,
      element,
      text,
      profile,
      defaultComposeHangulPlayer(profile, composeOptions),
    );
    return;
  }

  if (!isEditable(element)) {
    await user.type(element, text);
    return;
  }

  await playPlannedImeSteps(
    user,
    element,
    text,
    profile,
    defaultComposeHangulPlayer(profile, composeOptions),
  );
}

async function fillImeTarget(
  user: UserEvent,
  element: HTMLElement,
  text: string,
  profile: ImeProfile,
  composeOptions: Pick<ComposeHangulOptions, "settle" | "deferredUpdateRace">,
): Promise<void> {
  await user.click(element);
  await user.clear(element);
  await typeImeText(user, element, text, profile, composeOptions);
}

async function typeImeTarget(
  user: UserEvent,
  element: HTMLElement,
  text: string,
  profile: ImeProfile,
  composeOptions: Pick<ComposeHangulOptions, "settle" | "deferredUpdateRace">,
): Promise<void> {
  await user.click(element);
  await typeImeText(user, element, text, profile, composeOptions);
}

/**
 * Drop-in `fill` / `type` implementations for `overrideSiheom({ actions: createImeActions() })`.
 * Hangul runs use composition emulation; everything else uses `@testing-library/user-event`.
 */
export function createImeActions(options: CreateImeActionsOptions = {}) {
  const user = options.user ?? userEvent.setup();
  const resolveElement = options.resolveElement ?? "waitFor";
  const profile = resolveProfile(options.profile);
  const composeOptions = {
    settle: options.settle,
    deferredUpdateRace: options.deferredUpdateRace,
  };

  return {
    fill: (target: Locator, text: string) =>
      withPresentElement(target, resolveElement, (element) =>
        fillImeTarget(user, element, text, profile, composeOptions),
      ),
    type: (target: Locator, text: string) =>
      withPresentElement(target, resolveElement, (element) =>
        typeImeTarget(user, element, text, profile, composeOptions),
      ),
  } satisfies Pick<ActionStepDefinitionDict, "fill" | "type">;
}

export type ImeActions = ReturnType<typeof createImeActions>;
