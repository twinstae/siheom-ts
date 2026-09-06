import type { ComposedEventRecord } from "../_internal/index.js";
import { replayGoldenEvents } from "../replayGoldenEvents/index.js";
import { isEditable } from "../withPresentElement/index.js";
import brokenGolden from "../../fixtures/android-firefox-slate-placeholder-broken/first-hangul-가.json";

const CAPTURED_TEXT = "가";

function assertCapturedText(text: string): void {
  if (text !== CAPTURED_TEXT) {
    throw new Error(
      `android-firefox-slate-placeholder-broken: only ${CAPTURED_TEXT} is captured (got ${text})`,
    );
  }
}

/** AF Slate + placeholder — preedit 가 but DOM/value stuck at ㄱ (differs from Chrome jamo split). */
export async function composeHangulAndroidFirefoxSlatePlaceholderBroken(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, brokenGolden.events);
}

export async function composeHangulAndroidFirefoxSlatePlaceholderBrokenOnContentEditable(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, brokenGolden.events, { settle: "macrotask" });
}

export function composeHangulAndroidFirefoxSlatePlaceholderBrokenOn(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  if (isEditable(element)) {
    return composeHangulAndroidFirefoxSlatePlaceholderBroken(element, text);
  }
  return composeHangulAndroidFirefoxSlatePlaceholderBrokenOnContentEditable(element, text);
}
