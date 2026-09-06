import { segmentTypeText } from "../segmentTypeText/index.js";

export type TypeImeStep =
  | { kind: "hangul"; text: string; commitFinal: boolean }
  | { kind: "keys"; text: string };

const LEAVE_OPEN_KEYS = /\{(Backspace|ArrowLeft|Enter)\}/i;

/**
 * Turn a user-event-style type string into play steps: Hangul compose runs
 * (with commitFinal / leaveOpen) and keyboard runs.
 */
export function planTypeImeSteps(text: string): TypeImeStep[] {
  const segments = segmentTypeText(text);
  const steps: TypeImeStep[] = [];

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (!segment) continue;
    const next = segments[index + 1];

    if (segment.kind === "hangul") {
      const leaveOpen = next?.kind === "keys" && LEAVE_OPEN_KEYS.test(next.text);
      steps.push({ kind: "hangul", text: segment.text, commitFinal: !leaveOpen });
    } else {
      steps.push({ kind: "keys", text: segment.text });
    }
  }

  return steps;
}
