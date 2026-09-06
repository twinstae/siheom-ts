import type { ComposedEventRecord } from "../_internal/index.js";

/** Critical fields for golden-trace comparison (keyup order is flaky across captures). */
export function toCriticalEvents(events: ComposedEventRecord[]) {
  return events
    .filter((event) => event.type !== "keyup")
    .map((event) => ({
      type: event.type,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      isComposing: event.isComposing,
      inputType: event.inputType,
      data: event.data,
      value: event.value,
    }));
}
