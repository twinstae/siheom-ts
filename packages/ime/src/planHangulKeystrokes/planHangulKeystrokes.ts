import {
  assemble,
  canBeChoseong,
  canBeJongseong,
  canBeJungseong,
  combineVowels,
  disassembleCompleteCharacter,
} from "es-hangul";

import { hangulJamos } from "../hangulJamos/index.js";
import { keyForJamo } from "../_internal/jamoKeyMap.js";
import {
  keyForSebeolJamo,
  SEBEOL_COMPOUND_JONGSEONG_SEQ,
  SEBEOL_COMPOUND_JUNGSEONG_SEQ,
} from "../_internal/jamoKeyMapSebeol.js";
import { normalizeJungseong } from "../_internal/normalizeJungseong.js";
import type { HangulCompositionBoundary, HangulKeyboardLayout } from "../profiles/index.js";

export type HangulKeyStroke = {
  jamo: string;
  code: string;
  key: string;
  /** Physical KeyboardEvent.keyCode when known (세벌식 maps). */
  keyCode?: number;
  /** OS: Process+Shift then Shift before shifted jamo keys (ㅒ, 종성 ㄲ, …). */
  shiftLeadIn?: boolean;
  /** isComposing on keydown (false only for the first key of a composition session) */
  keydownIsComposing: boolean;
  /** Fire compositionstart before applying preedit updates for this key */
  compositionStart: boolean;
  /**
   * Ordered preedit snapshots applied during this key (usually one).
   * Syllable-boundary keys may include: [oldSyllable, newSyllablePreedit]
   * with a compositionend between them.
   */
  preeditSteps: string[];
  /** Full input values after each preeditSteps entry (same length) */
  valuesAfterSteps: string[];
  /** If set, fire compositionend with this data after the first preedit step (before later steps) */
  commitAfterFirstStep?: string;
};

type SyllableParts = {
  choseong?: string;
  jungseong?: string;
  jongseong?: string;
};

type KeyMeta = { code: string; key: string; keyCode?: number };

type PlannerState = {
  committed: string;
  runBase: string;
  current: SyllableParts;
  composing: boolean;
};

function syllableText(parts: SyllableParts): string {
  const { choseong, jungseong, jongseong } = parts;
  if (!choseong) return "";
  if (!jungseong) return choseong;
  return assemble([choseong, jungseong, ...(jongseong ? [jongseong] : [])]);
}

function isShiftedPhysicalKey(key: string): boolean {
  return key.length === 1 && key !== key.toLowerCase();
}

function boundaryStroke(
  meta: KeyMeta,
  jamo: string,
  preeditSteps: [string, string],
  valuesAfterSteps: [string, string],
  commitAfterFirstStep: string,
): HangulKeyStroke {
  return {
    jamo,
    code: meta.code,
    key: meta.key,
    keyCode: meta.keyCode,
    shiftLeadIn: isShiftedPhysicalKey(meta.key),
    keydownIsComposing: true,
    compositionStart: false,
    preeditSteps,
    valuesAfterSteps,
    commitAfterFirstStep,
  };
}

function singleStepStroke(
  meta: KeyMeta,
  jamo: string,
  preedit: string,
  value: string,
  composing: boolean,
): HangulKeyStroke {
  return {
    jamo,
    code: meta.code,
    key: meta.key,
    keyCode: meta.keyCode,
    shiftLeadIn: isShiftedPhysicalKey(meta.key),
    keydownIsComposing: composing,
    compositionStart: !composing,
    preeditSteps: [preedit],
    valuesAfterSteps: [value],
  };
}

function tryAttachChoseong(current: SyllableParts, jamo: string): SyllableParts | null {
  if (!canBeChoseong(jamo) || current.choseong) return null;
  return { choseong: jamo };
}

function tryAttachJungseong(current: SyllableParts, jamo: string): SyllableParts | null {
  if (!canBeJungseong(jamo) || !current.choseong) return null;
  if (!current.jungseong) return { ...current, jungseong: jamo };
  if (current.jongseong) return null;
  try {
    const combined = combineVowels(current.jungseong, jamo);
    if (combined && canBeJungseong(combined)) return { ...current, jungseong: combined };
  } catch {
    // not a combinable vowel pair
  }
  return null;
}

function tryAttachJongseong(current: SyllableParts, jamo: string): SyllableParts | null {
  if (!canBeJongseong(jamo) || !current.choseong || !current.jungseong) return null;
  if (!current.jongseong) return { ...current, jongseong: jamo };
  if (!canBeJongseong(`${current.jongseong}${jamo}`)) return null;
  return { ...current, jongseong: `${current.jongseong}${jamo}` };
}

function tryGrowSyllable(current: SyllableParts, jamo: string): SyllableParts | null {
  return (
    tryAttachChoseong(current, jamo) ??
    tryAttachJungseong(current, jamo) ??
    tryAttachJongseong(current, jamo)
  );
}

export type PlanHangulKeystrokesOptions = {
  /** Already-committed text before this Hangul run (e.g. Latin prefix). */
  prefix?: string;
  /** Desktop IMEs commit per syllable; Android keeps one composition for the run. */
  compositionBoundary?: HangulCompositionBoundary;
  /** Physical keyboard layout (defaults to 2-set). */
  hangulKeyboard?: HangulKeyboardLayout;
};

function planSebeolChoseong(
  state: PlannerState,
  choseong: string,
): { state: PlannerState; strokes: HangulKeyStroke[] } {
  const meta = keyForSebeolJamo(choseong, "choseong");
  if (state.current.choseong && state.current.jungseong) {
    const oldText = syllableText(state.current);
    const afterCommit = state.committed + oldText;
    return {
      state: {
        committed: afterCommit,
        runBase: state.runBase,
        current: { choseong },
        composing: true,
      },
      strokes: [
        boundaryStroke(
          meta,
          choseong,
          [oldText, choseong],
          [afterCommit, afterCommit + choseong],
          oldText,
        ),
      ],
    };
  }
  return {
    state: {
      ...state,
      current: { choseong },
      composing: true,
    },
    strokes: [
      singleStepStroke(meta, choseong, choseong, state.committed + choseong, state.composing),
    ],
  };
}

function planSebeolJungseong(
  state: PlannerState,
  jungseong: string,
): { state: PlannerState; strokes: HangulKeyStroke[] } {
  const compoundSeq = SEBEOL_COMPOUND_JUNGSEONG_SEQ[jungseong];
  if (compoundSeq) {
    const [head, tail] = compoundSeq;
    const withHead: SyllableParts = { ...state.current, jungseong: head };
    const midPreedit = syllableText(withHead);
    const withFull: SyllableParts = { ...state.current, jungseong };
    const preedit = syllableText(withFull);
    return {
      state: { ...state, current: withFull },
      strokes: [
        singleStepStroke(
          keyForSebeolJamo(head, "jungseong", { compoundHead: true }),
          head,
          midPreedit,
          state.committed + midPreedit,
          true,
        ),
        singleStepStroke(
          keyForSebeolJamo(tail, "jungseong"),
          jungseong,
          preedit,
          state.committed + preedit,
          true,
        ),
      ],
    };
  }
  const next: SyllableParts = { ...state.current, jungseong };
  const preedit = syllableText(next);
  return {
    state: { ...state, current: next },
    strokes: [
      singleStepStroke(
        keyForSebeolJamo(jungseong, "jungseong"),
        jungseong,
        preedit,
        state.committed + preedit,
        true,
      ),
    ],
  };
}

function planSebeolJongseong(
  state: PlannerState,
  jongseong: string,
): { state: PlannerState; strokes: HangulKeyStroke[] } {
  const compoundJong = SEBEOL_COMPOUND_JONGSEONG_SEQ[jongseong];
  if (compoundJong) {
    const [head, tail] = compoundJong;
    const withHead: SyllableParts = { ...state.current, jongseong: head };
    const midPreedit = syllableText(withHead);
    const withFull: SyllableParts = { ...state.current, jongseong };
    const preedit = syllableText(withFull);
    return {
      state: { ...state, current: withFull },
      strokes: [
        singleStepStroke(
          keyForSebeolJamo(head, "jongseong"),
          head,
          midPreedit,
          state.committed + midPreedit,
          true,
        ),
        singleStepStroke(
          keyForSebeolJamo(tail, "jongseong"),
          jongseong,
          preedit,
          state.committed + preedit,
          true,
        ),
      ],
    };
  }
  const next: SyllableParts = { ...state.current, jongseong };
  const preedit = syllableText(next);
  return {
    state: { ...state, current: next },
    strokes: [
      singleStepStroke(
        keyForSebeolJamo(jongseong, "jongseong"),
        jongseong,
        preedit,
        state.committed + preedit,
        true,
      ),
    ],
  };
}

function planOneSebeolSyllable(
  state: PlannerState,
  char: string,
): { state: PlannerState; strokes: HangulKeyStroke[] } {
  const parts = disassembleCompleteCharacter(char);
  if (!parts?.choseong) {
    throw new Error(`Cannot plan 세벌식-ngs for character: ${char}`);
  }
  const choseong = parts.choseong;
  const jungseong = parts.jungseong ? normalizeJungseong(parts.jungseong) : undefined;
  const jongseong = parts.jongseong ? parts.jongseong : undefined;

  let next = planSebeolChoseong(state, choseong);
  const strokes = [...next.strokes];
  if (jungseong) {
    next = planSebeolJungseong(next.state, jungseong);
    strokes.push(...next.strokes);
  }
  if (jongseong) {
    next = planSebeolJongseong(next.state, jongseong);
    strokes.push(...next.strokes);
  }
  return { state: next.state, strokes };
}

/**
 * 날개셋 세벌식: plan per Unicode syllable with role-based keys.
 * No 2-set batchim look-ahead across syllables (태|희 not 탷→흐).
 * ㅢ is one key (Digit8); ㅘ/ㅝ/… expand to two keys (Slash/Digit9 head + vowel).
 */
function planSebeolsikNgs(text: string, prefix: string): HangulKeyStroke[] {
  let state: PlannerState = {
    committed: prefix,
    runBase: "",
    current: {},
    composing: false,
  };
  const strokes: HangulKeyStroke[] = [];
  for (const char of text) {
    if (!char.trim()) continue;
    const planned = planOneSebeolSyllable(state, char);
    state = planned.state;
    strokes.push(...planned.strokes);
  }
  return strokes;
}

function stripJongseongForVowelCarry(current: SyllableParts): {
  stripped: SyllableParts;
  moved: string;
} {
  const jongChars = [...(current.jongseong ?? "")];
  const moved =
    jongChars.length > 1 ? (jongChars[jongChars.length - 1] ?? "") : (current.jongseong ?? "");
  const keptJong = jongChars.length > 1 ? jongChars[0] : undefined;
  return {
    moved,
    stripped: {
      choseong: current.choseong,
      jungseong: current.jungseong,
      ...(keptJong ? { jongseong: keptJong } : {}),
    },
  };
}

function planJungseongAfterJongseong(
  state: PlannerState,
  jamo: string,
  meta: KeyMeta,
  boundary: HangulCompositionBoundary,
): { state: PlannerState; strokes: HangulKeyStroke[] } | null {
  if (
    !canBeJungseong(jamo) ||
    !state.current.choseong ||
    !state.current.jungseong ||
    !state.current.jongseong
  ) {
    return null;
  }
  const { stripped, moved } = stripJongseongForVowelCarry(state.current);
  const strippedText = syllableText(stripped);
  const nextCurrent: SyllableParts = { choseong: moved, jungseong: jamo };
  const nextPreedit = syllableText(nextCurrent);

  if (boundary === "run") {
    const runBase = state.runBase + strippedText;
    const preedit = runBase + nextPreedit;
    return {
      state: {
        committed: state.committed,
        runBase,
        current: nextCurrent,
        composing: true,
      },
      strokes: [singleStepStroke(meta, jamo, preedit, state.committed + preedit, state.composing)],
    };
  }

  const afterCommit = state.committed + strippedText;
  return {
    state: {
      committed: afterCommit,
      runBase: state.runBase,
      current: nextCurrent,
      composing: true,
    },
    strokes: [
      boundaryStroke(
        meta,
        jamo,
        [strippedText, nextPreedit],
        [afterCommit, afterCommit + nextPreedit],
        strippedText,
      ),
    ],
  };
}

function planGrownStroke(
  state: PlannerState,
  jamo: string,
  meta: KeyMeta,
): { state: PlannerState; strokes: HangulKeyStroke[] } | null {
  const grown = tryGrowSyllable(state.current, jamo);
  if (!grown) return null;
  const preedit = state.runBase + syllableText(grown);
  return {
    state: { ...state, current: grown, composing: true },
    strokes: [singleStepStroke(meta, jamo, preedit, state.committed + preedit, state.composing)],
  };
}

function planChoseongAfterCompleteSyllable(
  state: PlannerState,
  jamo: string,
  meta: KeyMeta,
  boundary: HangulCompositionBoundary,
): { state: PlannerState; strokes: HangulKeyStroke[] } | null {
  if (!canBeChoseong(jamo) || !state.current.choseong || !state.current.jungseong) return null;
  const oldText = syllableText(state.current);

  if (boundary === "run") {
    const runBase = state.runBase + oldText;
    const preedit = runBase + jamo;
    return {
      state: {
        committed: state.committed,
        runBase,
        current: { choseong: jamo },
        composing: true,
      },
      strokes: [singleStepStroke(meta, jamo, preedit, state.committed + preedit, state.composing)],
    };
  }

  const afterCommit = state.committed + oldText;
  return {
    state: {
      committed: afterCommit,
      runBase: state.runBase,
      current: { choseong: jamo },
      composing: true,
    },
    strokes: [
      boundaryStroke(meta, jamo, [oldText, jamo], [afterCommit, afterCommit + jamo], oldText),
    ],
  };
}

function planOneDubeolsikJamo(
  state: PlannerState,
  jamo: string,
  boundary: HangulCompositionBoundary,
): { state: PlannerState; strokes: HangulKeyStroke[] } {
  const meta = keyForJamo(jamo);
  const afterJong =
    planJungseongAfterJongseong(state, jamo, meta, boundary) ??
    planGrownStroke(state, jamo, meta) ??
    planChoseongAfterCompleteSyllable(state, jamo, meta, boundary);
  if (afterJong) return afterJong;
  throw new Error(`Cannot place jamo "${jamo}" onto ${JSON.stringify(state.current)}`);
}

/** Plan per-keystroke Hangul IME behavior for `text` (2-set style / ibus-hangul-like). */
export function planHangulKeystrokes(
  text: string,
  options: PlanHangulKeystrokesOptions = {},
): HangulKeyStroke[] {
  if (options.hangulKeyboard === "sebeolsik-ngs") {
    return planSebeolsikNgs(text, options.prefix ?? "");
  }

  const boundary = options.compositionBoundary ?? "syllable";
  let state: PlannerState = {
    committed: options.prefix ?? "",
    runBase: "",
    current: {},
    composing: false,
  };
  const strokes: HangulKeyStroke[] = [];
  for (const jamo of hangulJamos(text)) {
    const planned = planOneDubeolsikJamo(state, jamo, boundary);
    state = planned.state;
    strokes.push(...planned.strokes);
  }
  return strokes;
}

/** Append `suffix` to each planned value without mutating the input strokes. */
export function withSuffix(strokes: HangulKeyStroke[], suffix: string): HangulKeyStroke[] {
  if (!suffix)
    return strokes.map((stroke) => ({ ...stroke, valuesAfterSteps: [...stroke.valuesAfterSteps] }));
  return strokes.map((stroke) => ({
    ...stroke,
    valuesAfterSteps: stroke.valuesAfterSteps.map((value) => value + suffix),
  }));
}
