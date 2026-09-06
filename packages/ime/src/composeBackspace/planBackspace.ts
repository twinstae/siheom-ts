import { assemble, disassembleCompleteCharacter } from "es-hangul";

import { hangulJamos } from "../hangulJamos/index.js";
import type { EventPlanStep } from "../_internal/eventPlan.js";
import { normalizeJungseong } from "../_internal/normalizeJungseong.js";
import { planPostCompositionEndInput, planPreedit } from "../_internal/planPreedit.js";
import type { ImeComposeSession } from "../_internal/session.js";
import type { HangulKeyboardLayout } from "../profiles/index.js";

function shrinkDubeolsikPreedit(preedit: string): string {
  const jamos = hangulJamos(preedit);
  if (jamos.length <= 1) return "";
  return assemble(jamos.slice(0, -1));
}

function shrinkSebeolsikPreedit(preedit: string): string {
  const chars = [...preedit];
  const last = chars[chars.length - 1];
  if (!last) return "";
  const parts = disassembleCompleteCharacter(last);
  if (!parts?.choseong) return shrinkDubeolsikPreedit(preedit);
  const prefix = chars.slice(0, -1).join("");
  if (parts.jongseong) {
    const jung = normalizeJungseong(parts.jungseong);
    return prefix + assemble([parts.choseong, jung]);
  }
  if (parts.jungseong) return prefix + parts.choseong;
  return prefix;
}

/** 2-set: remove one disassembled jamo. 세벌식: remove one role unit (ㅢ as one key). */
export function shrinkPreedit(
  preedit: string,
  hangulKeyboard: HangulKeyboardLayout = "dubeolsik",
): string {
  if (!preedit) return "";
  if (hangulKeyboard === "sebeolsik-ngs") return shrinkSebeolsikPreedit(preedit);
  return shrinkDubeolsikPreedit(preedit);
}

export type PlanBackspaceInput = {
  composing: boolean;
  session?: ImeComposeSession;
  value: string;
  selectionStart: number;
  selectionEnd: number;
  valueBefore: string;
  maxLength: number | null;
  hangulKeyboard?: HangulKeyboardLayout;
  postCompositionEndInput?: boolean;
};

function backspaceKeyup(isComposing: boolean): EventPlanStep {
  return {
    kind: "keyup",
    fields: {
      key: "Backspace",
      code: "Backspace",
      keyCode: 8,
      isComposing,
    },
  };
}

function planClearComposingSession(
  value: string,
  caret: number,
  postCompositionEndInput: boolean | undefined,
): EventPlanStep[] {
  return [
    { kind: "compositionend", data: "", value },
    ...(postCompositionEndInput ? planPostCompositionEndInput("") : []),
    { kind: "clearSession" },
    { kind: "setValue", value, caret },
    backspaceKeyup(false),
  ];
}

function planContinueComposingSession(
  session: ImeComposeSession,
  nextPreedit: string,
): EventPlanStep[] {
  return [
    { kind: "setSession", session: { ...session, preedit: nextPreedit } },
    backspaceKeyup(true),
  ];
}

function planComposingBackspace(input: PlanBackspaceInput): EventPlanStep[] {
  const session = input.session!;
  const nextPreedit = shrinkPreedit(session.preedit, input.hangulKeyboard ?? "dubeolsik");
  const caret = session.committed.length + nextPreedit.length;
  const value = session.committed + nextPreedit + session.suffix;

  const steps: EventPlanStep[] = [
    {
      kind: "keydown",
      fields: {
        key: "Process",
        code: "Backspace",
        keyCode: 229,
        isComposing: true,
      },
    },
    ...planPreedit(
      nextPreedit,
      value,
      caret,
      {
        valueBefore: input.valueBefore,
        maxLength: input.maxLength,
      },
      {
        emptyCompositionData: input.postCompositionEndInput ? "" : null,
      },
    ),
  ];

  if (nextPreedit === "") {
    return [...steps, ...planClearComposingSession(value, caret, input.postCompositionEndInput)];
  }
  return [...steps, ...planContinueComposingSession(session, nextPreedit)];
}

function nextValueAfterBackwardDelete(
  value: string,
  start: number,
  end: number,
): { value: string; caret: number } {
  if (start === end && start > 0) {
    return {
      value: value.slice(0, start - 1) + value.slice(end),
      caret: start - 1,
    };
  }
  if (start !== end) {
    return {
      value: value.slice(0, start) + value.slice(end),
      caret: start,
    };
  }
  return { value, caret: start };
}

function planDeleteContentBackward(input: PlanBackspaceInput): EventPlanStep[] {
  const { value, caret } = nextValueAfterBackwardDelete(
    input.value,
    input.selectionStart,
    input.selectionEnd,
  );
  return [
    {
      kind: "keydown",
      fields: {
        key: "Backspace",
        code: "Backspace",
        keyCode: 8,
        isComposing: false,
      },
    },
    {
      kind: "beforeinput",
      fields: {
        inputType: "deleteContentBackward",
        data: null,
        isComposing: false,
      },
    },
    { kind: "setValue", value, caret },
    {
      kind: "input",
      fields: {
        inputType: "deleteContentBackward",
        data: null,
        isComposing: false,
        value,
      },
    },
    backspaceKeyup(false),
  ];
}

/** Pure: Backspace while composing (decompose) or deleteContentBackward. */
export function planBackspace(input: PlanBackspaceInput): EventPlanStep[] {
  if (input.composing && input.session) return planComposingBackspace(input);
  return planDeleteContentBackward(input);
}
