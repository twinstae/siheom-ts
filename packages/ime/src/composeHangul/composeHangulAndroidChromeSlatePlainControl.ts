import type { ComposedEventRecord } from "../_internal/index.js";
import { replayGoldenEvents } from "../replayGoldenEvents/index.js";
import plainGolden from "../../fixtures/android-chrome-slate-plain-control/first-hangul-가.json";

const CAPTURED_TEXT = "가";

function assertCapturedText(text: string): void {
  if (text !== CAPTURED_TEXT) {
    throw new Error(
      `android-chrome-slate-plain-control: only ${CAPTURED_TEXT} is captured (got ${text})`,
    );
  }
}

/** Plain textarea control golden (second successful composition session). */
export async function composeHangulAndroidChromeSlatePlainControl(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): Promise<ComposedEventRecord[]> {
  assertCapturedText(text);
  element.focus();
  return replayGoldenEvents(element, plainGolden.events);
}
