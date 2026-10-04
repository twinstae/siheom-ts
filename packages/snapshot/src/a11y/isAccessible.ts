import { isEffectivelyHidden } from "./elementSemantics.js";

export function isInaccessible(el: Element): boolean {
  return isEffectivelyHidden(el);
}
