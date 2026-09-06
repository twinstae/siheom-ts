import { createScreenReaderGivens, type ScreenReaderGivens } from "./screenReaderGivens.js";
import { createScreenReaderEffects, type ScreenReaderEffects } from "./screenReaderEffects.js";
import {
  createScreenReaderAssertions,
  type ScreenReaderAssertions,
} from "./screenReaderAssertions.js";

export type VirtualScreenReaderExtension = {
  givens: ScreenReaderGivens;
  effects: ScreenReaderEffects;
  assertions: ScreenReaderAssertions;
};

/**
 * Registries to pass to `extendSiheom` (or spread into a registry bundle).
 * Adds new keys only — no collisions with the default siheom registries.
 */
export function createVirtualScreenReaderExtension(): VirtualScreenReaderExtension {
  return {
    givens: createScreenReaderGivens(),
    effects: createScreenReaderEffects(),
    assertions: createScreenReaderAssertions(),
  };
}
