import type { KeyEventFields } from "./events.js";
import { setInputValue } from "./events.js";
import type { InputEventFields, ImeTraceEmitter } from "./imeTrace.js";
import { ImeTrace } from "./imeTrace.js";
import {
  clearImeSession,
  getImeSession,
  setImeSession,
  type ImeComposeSession,
} from "./session.js";

export type EventPlanStep =
  | { kind: "keydown"; fields: KeyEventFields }
  | { kind: "keyup"; fields: KeyEventFields }
  | { kind: "compositionstart"; data?: string; value?: string }
  | { kind: "compositionupdate"; data: string; value?: string }
  | { kind: "compositionend"; data: string; value?: string }
  | { kind: "beforeinput"; fields: InputEventFields }
  | { kind: "input"; fields: InputEventFields }
  | { kind: "setValue"; value: string; caret: number }
  | { kind: "setSession"; session: ImeComposeSession }
  | { kind: "clearSession" }
  | { kind: "markPendingMaxLengthReject"; preedit: string; overflowValue: string };

function playKeyPlanStep(
  trace: ImeTraceEmitter,
  step: Extract<EventPlanStep, { kind: "keydown" | "keyup" }>,
): void {
  if (step.kind === "keydown") {
    trace.keydown(step.fields);
    return;
  }
  trace.keyup(step.fields);
}

function playCompositionPlanStep(
  trace: ImeTraceEmitter,
  step: Extract<
    EventPlanStep,
    { kind: "compositionstart" | "compositionupdate" | "compositionend" }
  >,
): void {
  if (step.kind === "compositionstart") {
    trace.compositionStart(step.data ?? "", step.value);
    return;
  }
  if (step.kind === "compositionupdate") {
    trace.compositionUpdate(step.data, step.value);
    return;
  }
  trace.compositionEnd(step.data, step.value);
}

function playInputPlanStep(
  trace: ImeTraceEmitter,
  step: Extract<EventPlanStep, { kind: "beforeinput" | "input" }>,
): void {
  if (step.kind === "beforeinput") {
    trace.beforeInput(step.fields);
    return;
  }
  trace.input(step.fields);
}

function playDomMutationPlanStep(
  inputElement: HTMLInputElement | HTMLTextAreaElement | null,
  step: Extract<EventPlanStep, { kind: "setValue" | "setSession" | "clearSession" }>,
): void {
  if (!inputElement) return;
  if (step.kind === "setValue") {
    setInputValue(inputElement, step.value, step.caret);
    return;
  }
  if (step.kind === "setSession") {
    setImeSession(inputElement, step.session);
    return;
  }
  clearImeSession(inputElement);
}

function playPendingMaxLengthRejectStep(
  inputElement: HTMLInputElement | HTMLTextAreaElement | null,
  step: Extract<EventPlanStep, { kind: "markPendingMaxLengthReject" }>,
): void {
  if (!inputElement) return;
  const session = getImeSession(inputElement);
  if (!session) return;
  setImeSession(inputElement, {
    ...session,
    pendingMaxLengthReject: {
      preedit: step.preedit,
      overflowValue: step.overflowValue,
    },
  });
}

function playEventPlanStep(
  trace: ImeTraceEmitter,
  inputElement: HTMLInputElement | HTMLTextAreaElement | null,
  step: EventPlanStep,
): void {
  switch (step.kind) {
    case "keydown":
    case "keyup":
      playKeyPlanStep(trace, step);
      return;
    case "compositionstart":
    case "compositionupdate":
    case "compositionend":
      playCompositionPlanStep(trace, step);
      return;
    case "beforeinput":
    case "input":
      playInputPlanStep(trace, step);
      return;
    case "setValue":
    case "setSession":
    case "clearSession":
      playDomMutationPlanStep(inputElement, step);
      return;
    case "markPendingMaxLengthReject":
      playPendingMaxLengthRejectStep(inputElement, step);
      return;
  }
}

/** Execute a pure event plan against an IME trace shell. */
export function playEventPlan(trace: ImeTraceEmitter, steps: EventPlanStep[]): void {
  const inputElement = trace instanceof ImeTrace ? trace.element : null;
  for (const step of steps) {
    playEventPlanStep(trace, inputElement, step);
  }
}
