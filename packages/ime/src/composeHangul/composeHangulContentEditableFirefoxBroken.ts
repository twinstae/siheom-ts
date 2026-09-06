import { disassemble } from "es-hangul";

import { planHangulKeystrokes } from "../planHangulKeystrokes/index.js";
import type { ComposedEventRecord } from "../_internal/index.js";
import { ContentEditableImeTrace } from "../_internal/contentEditableImeTrace.js";
import { playEventPlan, type EventPlanStep } from "../_internal/eventPlan.js";
import { ImeTrace } from "../_internal/imeTrace.js";
import { isEditable } from "../withPresentElement/index.js";
import {
  FIREFOX_CE_SENTINEL,
  planContentEditablePreeditPulse,
  planDuplicateCompositionPulse,
  planFirefoxDeferredEnd,
  withZwsp,
} from "./contentEditableFirefoxShared.js";

/** Plan preedit snapshots for broken Firefox contenteditable mode (first syllable stays jamo). */
export function planContentEditableBrokenPreeditSequence(text: string): string[] {
  const chars = [...text.replace(/\s/g, "")];
  if (chars.length === 0) return [];

  const firstSyllable = chars[0]!;
  const rest = chars.slice(1).join("");
  const jamoPrefix = disassemble(firstSyllable);
  const firstJamos = jamoPrefix.split("").filter((jamo) => jamo.trim().length > 0);

  const sequence: string[] = [firstJamos[0]!];

  let preedit = firstJamos[0]!;
  for (let index = 1; index < firstJamos.length; index++) {
    preedit += firstJamos[index];
    sequence.push(preedit);
  }

  if (!rest) return sequence;

  const strokes = planHangulKeystrokes(rest, { prefix: preedit });
  for (const stroke of strokes) {
    for (let stepIndex = 0; stepIndex < stroke.preeditSteps.length; stepIndex++) {
      if (stepIndex === 0 && stroke.commitAfterFirstStep !== undefined) continue;
      sequence.push(stroke.valuesAfterSteps[stepIndex]!);
    }
  }

  return sequence;
}

function planBrokenStrokeHead(index: number, previous: string): EventPlanStep[] {
  const isFirst = index === 0;
  const isRestart = index === 1;
  const head: EventPlanStep[] = [
    {
      kind: "keydown",
      fields: {
        key: "Process",
        code: "",
        keyCode: 229,
        isComposing: !isFirst && !isRestart,
      },
    },
  ];
  if (isFirst) {
    head.push({ kind: "compositionstart" });
    return head;
  }
  if (isRestart) {
    head.push({ kind: "compositionstart", data: previous, value: previous });
  }
  return head;
}

function brokenValueBefore(index: number, previous: string): string {
  if (index === 0 || index === 1) return FIREFOX_CE_SENTINEL;
  return withZwsp(previous);
}

function planBrokenFirstJamoTail(
  preedit: string,
  domValue: string,
  applyDom: boolean,
): EventPlanStep[] {
  const tail: EventPlanStep[] = [
    ...planDuplicateCompositionPulse(preedit, domValue),
    ...planFirefoxDeferredEnd(preedit),
  ];
  if (applyDom) {
    tail.push({ kind: "setValue", value: preedit, caret: preedit.length });
  }
  tail.push({ kind: "clearSession" });
  return tail;
}

function playBrokenPreeditAt(
  trace: ImeTrace | ContentEditableImeTrace,
  preeditSequence: string[],
  index: number,
  applyDom: boolean,
): void {
  const preedit = preeditSequence[index]!;
  const previous = index === 0 ? "" : preeditSequence[index - 1]!;
  const domValue = withZwsp(preedit);

  playEventPlan(trace, planBrokenStrokeHead(index, previous));
  playEventPlan(
    trace,
    planContentEditablePreeditPulse(
      preedit,
      brokenValueBefore(index, previous),
      domValue,
      applyDom,
      preedit.length,
    ),
  );
  playEventPlan(trace, [
    {
      kind: "keyup",
      fields: {
        key: "Process",
        code: "",
        keyCode: 229,
        isComposing: true,
      },
    },
  ]);

  if (index === 0) {
    playEventPlan(trace, planBrokenFirstJamoTail(preedit, domValue, applyDom));
  }
}

function playBrokenCommitFinal(
  trace: ImeTrace | ContentEditableImeTrace,
  finalPreedit: string,
): void {
  const domValue = withZwsp(finalPreedit);
  playEventPlan(trace, [
    ...planDuplicateCompositionPulse(finalPreedit, domValue),
    ...planFirefoxDeferredEnd(finalPreedit),
    { kind: "clearSession" },
  ]);
}

function playContentEditableBrokenSequence(
  trace: ImeTrace | ContentEditableImeTrace,
  text: string,
  commitFinal: boolean,
): ComposedEventRecord[] {
  const preeditSequence = planContentEditableBrokenPreeditSequence(text);
  const applyDom = trace instanceof ImeTrace;
  if (preeditSequence.length === 0) return trace.records;

  for (let index = 0; index < preeditSequence.length; index++) {
    playBrokenPreeditAt(trace, preeditSequence, index, applyDom);
  }

  if (commitFinal) {
    playBrokenCommitFinal(trace, preeditSequence[preeditSequence.length - 1]!);
  }

  return trace.records;
}

/**
 * Broken Firefox contenteditable path: after the first jamo, composition ends
 * prematurely and the first syllable stays jamo while later syllables compose normally.
 */
export async function composeHangulContentEditableFirefoxBroken(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  options: { commitFinal?: boolean } = {},
): Promise<ComposedEventRecord[]> {
  const { commitFinal = true } = options;
  element.focus();
  return playContentEditableBrokenSequence(new ImeTrace(element), text, commitFinal);
}

/** Same broken sequence for contenteditable (events only — host editor owns DOM). */
export async function composeHangulContentEditableFirefoxBrokenOnContentEditable(
  element: HTMLElement,
  text: string,
  options: { commitFinal?: boolean } = {},
): Promise<ComposedEventRecord[]> {
  const { commitFinal = true } = options;
  element.focus();
  return playContentEditableBrokenSequence(new ContentEditableImeTrace(element), text, commitFinal);
}

export function composeHangulContentEditableFirefoxBrokenOn(
  element: HTMLElement,
  text: string,
  options: { commitFinal?: boolean } = {},
): Promise<ComposedEventRecord[]> {
  if (isEditable(element)) {
    return composeHangulContentEditableFirefoxBroken(element, text, options);
  }
  return composeHangulContentEditableFirefoxBrokenOnContentEditable(element, text, options);
}
