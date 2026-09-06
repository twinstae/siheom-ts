import type { ComposedEventRecord } from "../_internal/index.js";
import { replayGoldenEvents } from "../replayGoldenEvents/index.js";
import { isEditable } from "../withPresentElement/index.js";
import fixedGolden from "../../fixtures/android-firefox-slate-placeholder-fixed/continuous-hangul-가나다.json";

const CAPTURED_TEXT = "가나다";

function assertCapturedText(text: string): void {
  if (text !== CAPTURED_TEXT) {
    throw new Error(
      `android-firefox-slate-placeholder-fixed: only ${CAPTURED_TEXT} is captured (got ${text})`,
    );
  }
}

/** AF Slate fixed-mode device golden — continuous 가나다 (preedit prefix dup without fix). */
export async function composeHangulAndroidFirefoxSlatePlaceholderFixed(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, fixedGolden.events);
}

export async function composeHangulAndroidFirefoxSlatePlaceholderFixedOnContentEditable(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, fixedGolden.events, { settle: "macrotask" });
}

export function composeHangulAndroidFirefoxSlatePlaceholderFixedOn(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  if (isEditable(element)) {
    return composeHangulAndroidFirefoxSlatePlaceholderFixed(element, text);
  }
  return composeHangulAndroidFirefoxSlatePlaceholderFixedOnContentEditable(element, text);
}
