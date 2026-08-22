import type { A11yLiveRegion } from "./types.js";

export function computeLive(
  el: Element,
  isVerbose = false,
): "off" | "polite" | "assertive" | null | undefined {
  const val = el.getAttribute("aria-live");
  if (val === "off" || val === "polite" || val === "assertive") {
    return val;
  }
  if (isVerbose && el.hasAttribute("aria-live")) return null;
  return undefined;
}

export function computeAtomic(el: Element, isVerbose = false): boolean | null | undefined {
  const val = el.getAttribute("aria-atomic");
  if (val === "true") return true;
  if (val === "false") return false;
  if (isVerbose && el.hasAttribute("aria-atomic")) return null;
  return undefined;
}

export function computeRelevant(el: Element, isVerbose = false): string | null | undefined {
  const val = el.getAttribute("aria-relevant");
  if (val) return val;
  if (isVerbose && el.hasAttribute("aria-relevant")) return null;
  return undefined;
}

export function computeBusy(el: Element, isVerbose = false): boolean | null | undefined {
  const val = el.getAttribute("aria-busy");
  if (val === "true") return true;
  if (val === "false") return false;
  if (isVerbose && el.hasAttribute("aria-busy")) return null;
  return undefined;
}

export function computeLiveRegion(el: Element, isVerbose = false): A11yLiveRegion | undefined {
  const region: A11yLiveRegion = {};
  let hasAny = false;

  const live = computeLive(el, isVerbose);
  if (live !== undefined) {
    region.live = live;
    hasAny = true;
  }

  const atomic = computeAtomic(el, isVerbose);
  if (atomic !== undefined) {
    region.atomic = atomic;
    hasAny = true;
  }

  const relevant = computeRelevant(el, isVerbose);
  if (relevant !== undefined) {
    region.relevant = relevant;
    hasAny = true;
  }

  const busy = computeBusy(el, isVerbose);
  if (busy !== undefined) {
    region.busy = busy;
    hasAny = true;
  }

  return hasAny ? region : undefined;
}
