import type { ComposedEventRecord } from "../_internal/index.js";
import { replayGoldenEvents } from "../replayGoldenEvents/index.js";
import plainGolden from "../../fixtures/android-firefox-slate-plain-control/first-hangul-가.json";

const CAPTURED_TEXT = "가";

function assertCapturedText(text: string): void {
  if (text !== CAPTURED_TEXT) {
    throw new Error(
      `android-firefox-slate-plain-control: only ${CAPTURED_TEXT} is captured (got ${text})`,
    );
  }
}

/** AF plain textarea — second composition session; 가 intact. */
export async function composeHangulAndroidFirefoxSlatePlainControl(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, plainGolden.events);
}
