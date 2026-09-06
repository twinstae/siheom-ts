import type { ImeProfile } from "../profiles/index.js";
import { keyForJamo } from "./jamoKeyMap.js";

const UNIDENTIFIED_KEY = { key: "Unidentified", code: "", keyCode: 229 } as const;

export function hangulKeydownFields(
  profile: ImeProfile,
  stroke: JamoStroke,
): { key: string; code: string; keyCode: number } {
  if (profile.hangulKeyEventKey === "jamo") {
    return { key: stroke.jamo, code: stroke.code, keyCode: 229 };
  }
  if (profile.hangulKeyEventKey === "unidentified") {
    return { ...UNIDENTIFIED_KEY };
  }
  return { key: "Process", code: stroke.code, keyCode: 229 };
}

export function hangulKeyupFields(
  profile: ImeProfile,
  stroke: JamoStroke,
  isComposing: boolean,
): { key: string; code: string; keyCode: number; isComposing: boolean } {
  if (profile.hangulKeyEventKey === "unidentified") {
    return { ...UNIDENTIFIED_KEY, isComposing };
  }
  if (profile.hangulKeyEventKey === "jamo") {
    const meta = keyForJamo(stroke.jamo);
    return {
      key: stroke.jamo,
      code: stroke.code,
      keyCode: meta.keyCode,
      isComposing,
    };
  }
  return {
    key: stroke.key,
    code: stroke.code,
    keyCode: stroke.keyCode ?? stroke.key.charCodeAt(0),
    isComposing,
  };
}

type JamoStroke = {
  jamo: string;
  code: string;
  key: string;
  /** Physical keyCode when known (세벌식 maps); avoids 2-set lookup for process keyups. */
  keyCode?: number;
};
