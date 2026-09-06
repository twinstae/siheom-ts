import { planHangulKeystrokes, type HangulKeyStroke } from "../planHangulKeystrokes/index.js";
import type { ComposedEventRecord } from "../_internal/index.js";
import { ContentEditableImeTrace } from "../_internal/contentEditableImeTrace.js";
import { playEventPlan } from "../_internal/eventPlan.js";
import { ImeTrace } from "../_internal/imeTrace.js";
import { isEditable } from "../withPresentElement/index.js";
import type { ImeProfile } from "../profiles/index.js";
import {
  contentEditableValueBefore,
  planContentEditableBoundaryCommit,
  planContentEditableBoundaryKeydown,
  planContentEditablePreeditPulse,
  planDuplicateCompositionPulse,
  planFirefoxDeferredEnd,
  stripZwsp,
  withZwsp,
} from "./contentEditableFirefoxShared.js";
import { planChromeStrokeHead, planChromeStrokeKeyup } from "./planStroke.js";
import { settleAfterPreedit } from "./settle.js";

type FixedPlayState = {
  sessionJustStarted: boolean;
  previousVisible: string;
};

const DEFAULT_FIXED_PROFILE: ImeProfile = {
  id: "linux-firefox-contenteditable-fixed",
  enterDuringComposition: "webkit",
  hangulKeyEventKey: "process",
  hangulComposeMode: "contenteditable-firefox-fixed",
  hanjaConversion: "replace",
  hangulCompositionBoundary: "syllable",
  hangulKeyboard: "dubeolsik",
  postCompositionEndInput: false,
};

function playFixedBoundaryKeydownIfNeeded(
  trace: ImeTrace | ContentEditableImeTrace,
  stroke: HangulKeyStroke,
  stepIndex: number,
  previousVisible: string,
): void {
  if (stepIndex !== 0 || stroke.commitAfterFirstStep === undefined) return;
  playEventPlan(trace, [planContentEditableBoundaryKeydown(withZwsp(previousVisible))]);
}

function nextFixedPlayState(
  stroke: HangulKeyStroke,
  stepIndex: number,
  value: string,
): FixedPlayState {
  const previousVisible = stripZwsp(value);
  if (stepIndex === 0 && stroke.commitAfterFirstStep !== undefined) {
    return { previousVisible, sessionJustStarted: true };
  }
  return { previousVisible, sessionJustStarted: false };
}

async function playFixedPreeditStep(
  trace: ImeTrace | ContentEditableImeTrace,
  stroke: HangulKeyStroke,
  stepIndex: number,
  state: FixedPlayState,
  applyDom: boolean,
  settleHost: boolean,
): Promise<FixedPlayState> {
  playFixedBoundaryKeydownIfNeeded(trace, stroke, stepIndex, state.previousVisible);

  const preedit = stroke.preeditSteps[stepIndex]!;
  const value = stroke.valuesAfterSteps[stepIndex]!;
  const valueBefore = contentEditableValueBefore(state.previousVisible, state.sessionJustStarted);
  const domValue = withZwsp(value);

  playEventPlan(
    trace,
    planContentEditablePreeditPulse(preedit, valueBefore, domValue, applyDom, domValue.length),
  );

  if (stepIndex === 0 && stroke.commitAfterFirstStep !== undefined) {
    playEventPlan(trace, planContentEditableBoundaryCommit(stroke.commitAfterFirstStep, value));
  }

  if (settleHost) await settleAfterPreedit("macrotask");
  return nextFixedPlayState(stroke, stepIndex, value);
}

async function playFixedStroke(
  trace: ImeTrace | ContentEditableImeTrace,
  stroke: HangulKeyStroke,
  state: FixedPlayState,
  profile: ImeProfile,
  applyDom: boolean,
  settleHost: boolean,
): Promise<FixedPlayState> {
  playEventPlan(trace, planChromeStrokeHead(stroke, profile));
  let next = state;
  for (let stepIndex = 0; stepIndex < stroke.preeditSteps.length; stepIndex++) {
    next = await playFixedPreeditStep(trace, stroke, stepIndex, next, applyDom, settleHost);
  }
  playEventPlan(trace, planChromeStrokeKeyup(stroke, profile));
  if (settleHost) await settleAfterPreedit("macrotask");
  return next;
}

async function playFixedCommitFinal(
  trace: ImeTrace | ContentEditableImeTrace,
  strokes: HangulKeyStroke[],
  text: string,
  settleHost: boolean,
): Promise<void> {
  if (strokes.length === 0) return;
  const lastStroke = strokes[strokes.length - 1]!;
  const finalPreedit = lastStroke.preeditSteps[lastStroke.preeditSteps.length - 1] ?? text;
  const finalDomValue = lastStroke.valuesAfterSteps[lastStroke.valuesAfterSteps.length - 1] ?? text;
  playEventPlan(trace, [
    ...planDuplicateCompositionPulse(finalPreedit, withZwsp(finalDomValue)),
    ...planFirefoxDeferredEnd(finalPreedit, finalDomValue),
    { kind: "clearSession" },
  ]);
  if (settleHost) await settleAfterPreedit("macrotask");
}

async function playContentEditableFixedSequence(
  trace: ImeTrace | ContentEditableImeTrace,
  text: string,
  commitFinal: boolean,
  profile: ImeProfile,
): Promise<ComposedEventRecord[]> {
  const strokes = planHangulKeystrokes(text);
  const applyDom = trace instanceof ImeTrace;
  const settleHost = trace instanceof ContentEditableImeTrace;
  let state: FixedPlayState = { sessionJustStarted: true, previousVisible: "" };

  for (const stroke of strokes) {
    state = await playFixedStroke(trace, stroke, state, profile, applyDom, settleHost);
  }

  if (commitFinal) {
    await playFixedCommitFinal(trace, strokes, text, settleHost);
  }

  return trace.records;
}

/** Fixed Firefox contenteditable path: syllable commits with deferred compositionend. */
export async function composeHangulContentEditableFirefoxFixed(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  options: { commitFinal?: boolean; profile?: ImeProfile } = {},
): Promise<ComposedEventRecord[]> {
  const { commitFinal = true, profile } = options;
  element.focus();
  return playContentEditableFixedSequence(
    new ImeTrace(element),
    text,
    commitFinal,
    profile ?? DEFAULT_FIXED_PROFILE,
  );
}

export async function composeHangulContentEditableFirefoxFixedOnContentEditable(
  element: HTMLElement,
  text: string,
  options: { commitFinal?: boolean; profile?: ImeProfile } = {},
): Promise<ComposedEventRecord[]> {
  const { commitFinal = true, profile } = options;
  element.focus();
  return playContentEditableFixedSequence(
    new ContentEditableImeTrace(element),
    text,
    commitFinal,
    profile ?? DEFAULT_FIXED_PROFILE,
  );
}

export function composeHangulContentEditableFirefoxFixedOn(
  element: HTMLElement,
  text: string,
  options: { commitFinal?: boolean; profile?: ImeProfile } = {},
): Promise<ComposedEventRecord[]> {
  if (isEditable(element)) {
    return composeHangulContentEditableFirefoxFixed(element, text, options);
  }
  return composeHangulContentEditableFirefoxFixedOnContentEditable(element, text, options);
}
