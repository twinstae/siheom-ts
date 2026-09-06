import { assemble } from "es-hangul";

import { hangulJamos } from "../hangulJamos/index.js";

/** Progressive field values while typing `text` with a Hangul IME (jamo-by-jamo). */
export function hangulValueProgression(text: string): string[] {
  const jamos = hangulJamos(text);
  const values: string[] = [];
  for (let i = 0; i < jamos.length; i++) {
    values.push(assemble(jamos.slice(0, i + 1)));
  }
  return values;
}
