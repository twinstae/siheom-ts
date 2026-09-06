import type { ComposedEventRecord } from "../_internal/index.js";
import { replayGoldenEvents } from "../replayGoldenEvents/index.js";
import { isEditable } from "../withPresentElement/index.js";
import afFixedGolden from "../../fixtures/android-firefox-contenteditable-fixed/continuous-hangul.json";

const CAPTURED_TEXT = "가나다";

function assertCapturedText(text: string): void {
  if (text !== CAPTURED_TEXT) {
    throw new Error(
      `android-firefox-contenteditable-fixed: only ${CAPTURED_TEXT} is captured (got ${text})`,
    );
  }
}

/** AF post-fix v2 device golden replay — visible 가나다 on plain input. */
export async function composeHangulContentEditableAndroidFirefoxFixed(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, afFixedGolden.events);
}

export async function composeHangulContentEditableAndroidFirefoxFixedOnContentEditable(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, afFixedGolden.events, { settle: "macrotask" });
}

export function composeHangulContentEditableAndroidFirefoxFixedOn(
  element: HTMLElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  if (isEditable(element)) {
    return composeHangulContentEditableAndroidFirefoxFixed(element, text);
  }
  return composeHangulContentEditableAndroidFirefoxFixedOnContentEditable(element, text);
}
