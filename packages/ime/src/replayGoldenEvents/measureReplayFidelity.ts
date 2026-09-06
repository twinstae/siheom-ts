import type { ComposedEventRecord } from "../_internal/types.js";
import { ContentEditableImeTrace } from "../_internal/contentEditableImeTrace.js";
import { setInputValue } from "../_internal/events.js";
import { ImeTrace } from "../_internal/imeTrace.js";
import { isEditable } from "../withPresentElement/index.js";
import { settleAfterPreedit } from "../composeHangul/settle.js";
import { applyGoldenDomWriteback, stripGoldenText } from "./goldenDomWriteback.js";
import { playGoldenEvent, type ReplayGoldenEventsOptions } from "./replayGoldenEvents.js";

export type MeasureReplayFidelityOptions = ReplayGoldenEventsOptions;

export type FidelityStep = {
  index: number;
  type: string;
  data: string | null;
  expected: string;
  actual: string;
  matched: boolean;
};

export type FidelityReport = {
  totalSteps: number;
  matchedSteps: number;
  matchRate: number;
  firstMismatchIndex: number | null;
  steps: FidelityStep[];
};

async function applyReplayStepDomEffects(
  trace: ImeTrace | ContentEditableImeTrace,
  element: HTMLElement,
  event: ComposedEventRecord,
  options: MeasureReplayFidelityOptions,
  expected: string,
): Promise<void> {
  if (trace instanceof ImeTrace && event.type === "input" && event.value != null) {
    const visible = stripGoldenText(event.value);
    setInputValue(trace.element, visible, visible.length);
  }

  if (options.settle === "macrotask" && trace instanceof ContentEditableImeTrace) {
    await settleAfterPreedit("macrotask");
  }

  if ((options.writeback ?? "none") === "golden") {
    applyGoldenDomWriteback(element, expected);
  }
}

function compareFidelityStep(
  index: number,
  event: ComposedEventRecord,
  expected: string,
  actual: string,
): FidelityStep {
  return {
    index,
    type: event.type,
    data: event.data,
    expected,
    actual,
    matched: expected === actual,
  };
}

function summarizeFidelityReport(steps: FidelityStep[]): FidelityReport {
  const matchedSteps = steps.filter((step) => step.matched).length;
  return {
    totalSteps: steps.length,
    matchedSteps,
    matchRate: steps.length === 0 ? 1 : matchedSteps / steps.length,
    firstMismatchIndex: steps.find((step) => !step.matched)?.index ?? null,
    steps,
  };
}

/**
 * Replay golden events step-by-step and compare DOM to each event's captured `value`.
 * Experiment A: if broken-mode replay ≠ golden, Chromium replay is not device-faithful.
 */
export async function measureReplayFidelity(
  element: HTMLElement,
  events: ComposedEventRecord[],
  readDom: (element: HTMLElement) => string,
  options: MeasureReplayFidelityOptions = {},
): Promise<FidelityReport> {
  const trace = isEditable(element) ? new ImeTrace(element) : new ContentEditableImeTrace(element);
  element.focus();

  const steps: FidelityStep[] = [];
  for (const [index, event] of events.entries()) {
    playGoldenEvent(trace, event);
    const expected = stripGoldenText(event.value ?? "");
    await applyReplayStepDomEffects(trace, element, event, options, expected);
    steps.push(compareFidelityStep(index, event, expected, stripGoldenText(readDom(element))));
  }

  return summarizeFidelityReport(steps);
}

export function formatFidelityReport(report: FidelityReport, limit = 5): string {
  const lines = [
    `match ${report.matchedSteps}/${report.totalSteps} (${(report.matchRate * 100).toFixed(1)}%)`,
    `firstMismatch: ${report.firstMismatchIndex ?? "none"}`,
  ];
  if (report.firstMismatchIndex !== null) {
    const mismatches = report.steps.filter((step) => !step.matched).slice(0, limit);
    for (const step of mismatches) {
      lines.push(
        `  #${step.index} ${step.type} data=${JSON.stringify(step.data)} expected=${JSON.stringify(step.expected)} actual=${JSON.stringify(step.actual)}`,
      );
    }
  }
  return lines.join("\n");
}
