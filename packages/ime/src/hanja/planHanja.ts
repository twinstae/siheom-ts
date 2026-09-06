import type { HanjaConversionMode } from "../profiles/index.js";
import type { EventPlanStep } from "../_internal/eventPlan.js";
import { planPreedit } from "../_internal/planPreedit.js";
import { planSafariInsertFromComposition } from "../_internal/planSafari.js";

export type PlanHanjaBounds = {
  prefix: string;
  suffix: string;
};

export type PlanHanjaFacts = {
  valueBefore: string;
  maxLength: number | null;
};

/** Pure: Option+Enter Hangul→Hanja conversion for one syllable. */
export function planHanjaConversion(input: {
  mode: HanjaConversionMode;
  hangul: string;
  hanja: string;
  bounds: PlanHanjaBounds;
  facts: PlanHanjaFacts;
}): EventPlanStep[] {
  const { hangul, hanja, bounds, facts } = input;
  const { prefix, suffix } = bounds;
  const hangulValue = prefix + hangul + suffix;

  if (input.mode === "append") {
    const appended = prefix + hangul + hanja + suffix;
    return [
      {
        kind: "keydown",
        fields: { key: "Alt", code: "AltLeft", keyCode: 18, isComposing: true },
      },
      {
        kind: "keydown",
        fields: { key: "Enter", code: "Enter", keyCode: 229, isComposing: true },
      },
      ...planPreedit(hangul, hangulValue, prefix.length + hangul.length, facts),
      { kind: "compositionstart" },
      ...planPreedit(hanja, appended, prefix.length + hangul.length + hanja.length, {
        valueBefore: hangulValue,
        maxLength: facts.maxLength,
      }),
      {
        kind: "setSession",
        session: {
          composing: true,
          committed: prefix + hangul,
          preedit: hanja,
          suffix,
        },
      },
      {
        kind: "keyup",
        fields: { key: "Enter", code: "Enter", keyCode: 13, isComposing: true },
      },
      {
        kind: "keyup",
        fields: { key: "Alt", code: "AltLeft", keyCode: 18, isComposing: true },
      },
    ];
  }

  const replaced = prefix + hanja + suffix;
  return [
    {
      kind: "keydown",
      fields: { key: "Alt", code: "AltLeft", keyCode: 18, isComposing: true },
    },
    ...planPreedit(hangul, hangulValue, prefix.length + hangul.length, facts),
    ...planSafariInsertFromComposition(hangul, hangulValue, {
      clearedCaret: prefix.length,
      finalCaret: prefix.length + hangul.length,
    }),
    { kind: "compositionstart", data: hangul, value: hangulValue },
    ...planPreedit(hanja, replaced, prefix.length + hanja.length, {
      valueBefore: hangulValue,
      maxLength: facts.maxLength,
    }),
    {
      kind: "setSession",
      session: {
        composing: true,
        committed: prefix,
        preedit: hanja,
        suffix,
      },
    },
  ];
}

/** Pure: confirm Hanja candidate after conversion. */
export function planHanjaConfirm(input: {
  mode: HanjaConversionMode;
  hangul: string;
  hanja: string;
  committedPrefix: string;
  suffix: string;
  /** Current DOM value during append confirm (김金). */
  appendedValue: string;
  facts: PlanHanjaFacts;
}): EventPlanStep[] {
  const { hangul, hanja, committedPrefix, suffix, appendedValue, facts } = input;

  if (input.mode === "append") {
    const settled = committedPrefix + hanja + suffix;
    return [
      {
        kind: "keydown",
        fields: { key: "Enter", code: "Enter", keyCode: 229, isComposing: true },
      },
      ...planPreedit(
        hanja,
        appendedValue,
        committedPrefix.length + hangul.length + hanja.length,
        facts,
      ),
      { kind: "compositionend", data: hanja },
      {
        kind: "setValue",
        value: settled,
        caret: committedPrefix.length + hanja.length,
      },
      { kind: "clearSession" },
    ];
  }

  const settled = committedPrefix + hanja + suffix;
  const caret = committedPrefix.length + hanja.length;

  return [
    ...planPreedit(hanja, settled, caret, facts),
    ...planPreedit(hanja, settled, caret, {
      valueBefore: settled,
      maxLength: facts.maxLength,
    }),
    {
      kind: "keydown",
      fields: { key: "Enter", code: "Enter", keyCode: 229, isComposing: true },
    },
    ...planPreedit(hanja, settled, caret, {
      valueBefore: settled,
      maxLength: facts.maxLength,
    }),
    ...planSafariInsertFromComposition(hanja, settled),
    {
      kind: "keydown",
      fields: { key: "Enter", code: "Enter", keyCode: 229, isComposing: false },
    },
    { kind: "clearSession" },
  ];
}
