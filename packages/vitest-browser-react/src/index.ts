import { createRunSiheom, effect, withFakeTimers } from "@siheom/core";
import { actions, defaultBrowserActions } from "./action.js";
import { assertions, defaultBrowserAssertions } from "./assert.js";
import { cleanupReactRoots, defaultGivens, given } from "./given.js";
import { reactEffects } from "./effects.js";
import { reactFakeTimerScope } from "./fakeTimerScope.js";
import { createBrowserFakeTimerScopedRegistries } from "./fakeTimerRegistries.js";
import { query } from "./query.js";

export const runSiheom = createRunSiheom({
  actions: defaultBrowserActions,
  assertions: defaultBrowserAssertions,
  givens: defaultGivens,
  effects: reactEffects,
  fakeTimerScope: reactFakeTimerScope,
  createFakeTimerScopedRegistries: createBrowserFakeTimerScopedRegistries,
});

export { actions, assertions, query, given, effect, withFakeTimers };
export { cleanupReactRoots, defaultGivens, reactEffects, reactFakeTimerScope };
export { act, render, cleanup } from "./testingLibraryReactCompat.js";
