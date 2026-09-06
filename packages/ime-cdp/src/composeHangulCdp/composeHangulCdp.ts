import { planHangulKeystrokes } from "@siheom/ime";

import { getVitestCdpSession, type CdpSend } from "../cdpSession/index.js";

export type ComposeHangulCdpOptions = {
  session?: CdpSend;
  /** When true (default), commit the final preedit via `Input.insertText`. */
  commitFinal?: boolean;
};

async function imeSetComposition(session: CdpSend, text: string): Promise<void> {
  await session("Input.imeSetComposition", {
    text,
    selectionStart: text.length,
    selectionEnd: text.length,
  });
}

async function insertText(session: CdpSend, text: string): Promise<void> {
  await session("Input.insertText", { text });
}

/**
 * Drive Hangul composition through Chromium CDP (`Input.imeSetComposition` + `Input.insertText`).
 * Preedit progression follows `@siheom/ime` `planHangulKeystrokes`.
 *
 * Spike notes (Chromium headless):
 * - Each preedit step → `imeSetComposition` with the syllable/jamo string
 * - Syllable boundary (`commitAfterFirstStep`) → `insertText` to commit, then new composition
 * - Final commit → `insertText` with the last preedit (replaces composition region)
 */
export async function composeHangulCdp(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  options: ComposeHangulCdpOptions = {},
): Promise<void> {
  const session = options.session ?? getVitestCdpSession();
  const commitFinal = options.commitFinal ?? true;
  const prefix = element.value;

  element.focus();

  const strokes = planHangulKeystrokes(text, { prefix });
  let lastPreedit = "";

  for (const stroke of strokes) {
    for (let i = 0; i < stroke.preeditSteps.length; i++) {
      const preedit = stroke.preeditSteps[i]!;
      await imeSetComposition(session, preedit);
      lastPreedit = preedit;

      if (i === 0 && stroke.commitAfterFirstStep != null) {
        await insertText(session, stroke.commitAfterFirstStep);
        lastPreedit = "";
      }
    }
  }

  if (commitFinal && lastPreedit) {
    await insertText(session, lastPreedit);
  }
}
