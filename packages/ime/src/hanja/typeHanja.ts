import {
  getImeSession,
  ImeTrace,
  playEventPlan,
  readMaxLength,
  type ComposedEventRecord,
} from "../_internal/index.js";
import { composeHangul } from "../composeHangul/index.js";
import { resolveProfile, type ImeProfile } from "../profiles/index.js";
import { composeHanjaConversion } from "./composeHanjaConversion.js";
import { planHanjaConfirm } from "./planHanja.js";

export type TypeHanjaOptions = {
  profile?: string | ImeProfile;
};

/**
 * Type Hanja by composing each Hangul reading then converting via Option+Enter.
 * `hanja` and `hangul` must be the same length in Unicode code points
 * (e.g. typeHanja(el, "金泰熙", "김태희")).
 */
export async function typeHanja(
  element: HTMLInputElement | HTMLTextAreaElement,
  hanja: string,
  hangul: string,
  options: TypeHanjaOptions = {},
): Promise<ComposedEventRecord[]> {
  const profile = resolveProfile(options.profile);
  const hanjaChars = [...hanja];
  const hangulChars = [...hangul];

  if (hanjaChars.length !== hangulChars.length) {
    throw new Error(
      `typeHanja: hanja (${hanjaChars.length}) and hangul (${hangulChars.length}) length must match`,
    );
  }

  const trace = new ImeTrace(element);
  const hangulProfile = hangulProfileForConversion(profile);

  for (let i = 0; i < hanjaChars.length; i++) {
    const hanjaChar = hanjaChars[i]!;
    const hangulChar = hangulChars[i]!;

    trace.append(
      await composeHangul(element, hangulChar, {
        commitFinal: false,
        profile: hangulProfile,
      }),
    );
    trace.append(
      await composeHanjaConversion(element, {
        hangul: hangulChar,
        hanja: hanjaChar,
        profile,
      }),
    );
    playHanjaConfirm(trace, hangulChar, hanjaChar, profile);
  }

  return trace.records;
}

/** Replacement-mode Hangul cannot stay composing for Option+Enter; use composition. */
function hangulProfileForConversion(profile: ImeProfile): ImeProfile {
  if (profile.hangulComposeMode !== "replacement") return profile;
  return { ...profile, hangulComposeMode: "composition" };
}

function playHanjaConfirm(
  trace: ImeTrace,
  hangul: string,
  hanja: string,
  profile: ImeProfile,
): void {
  const { element } = trace;
  const session = getImeSession(element);
  const suffix = session?.suffix ?? "";
  const committed = session?.committed ?? "";
  const committedPrefix =
    profile.hanjaConversion === "append"
      ? committed.endsWith(hangul)
        ? committed.slice(0, -hangul.length)
        : committed
      : (session?.committed ??
        element.value.slice(0, Math.max(0, element.value.length - hanja.length)));

  playEventPlan(
    trace,
    planHanjaConfirm({
      mode: profile.hanjaConversion,
      hangul,
      hanja,
      committedPrefix,
      suffix,
      appendedValue: element.value,
      facts: {
        valueBefore: element.value,
        maxLength: readMaxLength(element),
      },
    }),
  );
}
