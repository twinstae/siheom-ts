import type { ComposedEventRecord } from "../_internal/index.js";
import { replayGoldenEvents } from "../replayGoldenEvents/index.js";
import { isEditable } from "../withPresentElement/index.js";
import brokenGolden from "../../fixtures/android-chrome-slate-placeholder-broken/first-hangul-가.json";

const CAPTURED_TEXT = "가";

function assertCapturedText(text: string): void {
  if (text !== CAPTURED_TEXT) {
    throw new Error(
      `android-chrome-slate-placeholder-broken: only ${CAPTURED_TEXT} is captured (got ${text})`,
    );
  }
}

/** Slate #5989 device golden — visible ㄱㄱㅏㄱㅏ on plain input. */
export async function composeHangulAndroidChromeSlatePlaceholderBroken(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, brokenGolden.events);
}

export async function composeHangulAndroidChromeSlatePlaceholderBrokenOnContentEditable(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, brokenGolden.events, { settle: "macrotask" });
}

export function composeHangulAndroidChromeSlatePlaceholderBrokenOn(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  if (isEditable(element)) {
    return composeHangulAndroidChromeSlatePlaceholderBroken(element, text);
  }
  return composeHangulAndroidChromeSlatePlaceholderBrokenOnContentEditable(element, text);
}
