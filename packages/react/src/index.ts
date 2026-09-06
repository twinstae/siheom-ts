import { actions, assertions, createRunSiheom, effect, query, withFakeTimers } from "@siheom/core";
import { cleanupReactRoots, defaultGivens, given } from "./given.js";
import { reactEffects } from "./effects.js";
import { reactFakeTimerScope } from "./fakeTimerScope.js";
import {
  createReactFakeTimerScopedRegistries,
  reactActions,
  reactAssertions,
} from "./reactRegistries.js";

export const runSiheom = createRunSiheom({
  actions: reactActions,
  assertions: reactAssertions,
  givens: defaultGivens,
  effects: reactEffects,
  fakeTimerScope: reactFakeTimerScope,
  createFakeTimerScopedRegistries: createReactFakeTimerScopedRegistries,
});

export { actions, assertions, query, given, effect, withFakeTimers };
export { defaultGivens, cleanupReactRoots, reactEffects, reactFakeTimerScope };
