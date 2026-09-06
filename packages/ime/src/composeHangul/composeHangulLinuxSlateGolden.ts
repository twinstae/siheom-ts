import type { ComposedEventRecord } from "../_internal/index.js";
import { replayGoldenEvents } from "../replayGoldenEvents/index.js";
import { isEditable } from "../withPresentElement/index.js";
import lcPlaceholderGolden from "../../fixtures/linux-chrome-slate-placeholder-fixed/first-hangul-가.json";
import lcPlainGolden from "../../fixtures/linux-chrome-slate-plain-control/first-hangul-가.json";
import lfPlaceholderGolden from "../../fixtures/linux-firefox-slate-placeholder-fixed/first-hangul-가.json";
import lfPlainGolden from "../../fixtures/linux-firefox-slate-plain-control/first-hangul-가.json";

const CAPTURED_TEXT = "가";

type GoldenFile = { events: ComposedEventRecord[] };

function assertCapturedText(profileId: string, text: string): void {
  if (text !== CAPTURED_TEXT) {
    throw new Error(`${profileId}: only ${CAPTURED_TEXT} is captured (got ${text})`);
  }
}

function createSlateGoldenReplay(profileId: string, golden: GoldenFile) {
  async function onInput(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
  ): Promise<ComposedEventRecord[]> {
    assertCapturedText(profileId, text);
    element.focus();
    return replayGoldenEvents(element, golden.events);
  }

  async function onContentEditable(
    element: HTMLElement,
    text: string,
  ): Promise<ComposedEventRecord[]> {
    assertCapturedText(profileId, text);
    element.focus();
    return replayGoldenEvents(element, golden.events, { settle: "macrotask" });
  }

  function on(element: HTMLElement, text: string): Promise<ComposedEventRecord[]> {
    if (isEditable(element)) {
      return onInput(element, text);
    }
    return onContentEditable(element, text);
  }

  return { onInput, onContentEditable, on };
}

const lcPlaceholder = createSlateGoldenReplay(
  "linux-chrome-slate-placeholder-fixed",
  lcPlaceholderGolden,
);
const lcPlain = createSlateGoldenReplay("linux-chrome-slate-plain-control", lcPlainGolden);
const lfPlaceholder = createSlateGoldenReplay(
  "linux-firefox-slate-placeholder-fixed",
  lfPlaceholderGolden,
);
const lfPlain = createSlateGoldenReplay("linux-firefox-slate-plain-control", lfPlainGolden);

export const composeHangulLinuxChromeSlatePlaceholderFixed = lcPlaceholder.onInput;
export const composeHangulLinuxChromeSlatePlaceholderFixedOn = lcPlaceholder.on;
export const composeHangulLinuxChromeSlatePlainControl = lcPlain.onInput;
export const composeHangulLinuxFirefoxSlatePlaceholderFixed = lfPlaceholder.onInput;
export const composeHangulLinuxFirefoxSlatePlaceholderFixedOn = lfPlaceholder.on;
export const composeHangulLinuxFirefoxSlatePlainControl = lfPlain.onInput;
