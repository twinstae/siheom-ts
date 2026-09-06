import type { ComposedEventRecord } from "../_internal/types.js";

/** Experiment B — event + expected DOM snapshot per step (device capture shape). */
export type DualTraceStep = {
  event: ComposedEventRecord;
  expectedDom: string;
};

export type DualTrace = {
  profileId?: string;
  scenarioId?: string;
  steps: DualTraceStep[];
};

export type ImeTraceLike = {
  events: ComposedEventRecord[];
  profileId?: string;
  scenarioId?: string;
};

/** Build dual trace from downloaded IME JSON (`events[].value` → `expectedDom`). */
export function dualTraceFromImeCapture(capture: ImeTraceLike): DualTrace {
  return {
    profileId: capture.profileId,
    scenarioId: capture.scenarioId,
    steps: capture.events.map((event) => ({
      event,
      expectedDom: event.value ?? "",
    })),
  };
}
