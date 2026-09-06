import type { ComposedEventRecord } from "../_internal/index.js";
import { toCriticalEvents } from "../toCriticalEvents/index.js";

export type GoldenEventRecord = ComposedEventRecord;

export function goldenToRecords(events: GoldenEventRecord[]): ComposedEventRecord[] {
  return events.map((event) => ({ ...event }));
}

export function goldenCritical(events: GoldenEventRecord[]) {
  return toCriticalEvents(goldenToRecords(events));
}

/** Slice golden/events from the first compositionstart (Hangul session after Latin, etc.). */
export function fromFirstCompositionStart<T extends { type: string }>(events: T[]): T[] {
  const index = events.findIndex((event) => event.type === "compositionstart");
  return index === -1 ? events : events.slice(index);
}
