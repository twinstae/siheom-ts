import { createRunSiheom } from "@siheom/core/siheom";
import { effect } from "@siheom/core/effect";
import { withFakeTimers } from "@siheom/core/with-fake-timers";
import { cleanupReactRoots, defaultGivens, given } from "./given.js";
import { reactNativeEffects } from "./effects.js";
import { reactNativeFakeTimerScope } from "./fakeTimerScope.js";
import { getFailureSnapshot } from "./getA11ySnapshot.js";
import { query } from "./queryBuilders.js";
import {
  createReactNativeFakeTimerScopedRegistries,
  reactNativeActions,
  reactNativeAssertions,
} from "./reactRegistries.js";
import { actions, assertions } from "./stepBuilders.js";

export const runSiheom = createRunSiheom({
  actions: reactNativeActions,
  assertions: reactNativeAssertions,
  givens: defaultGivens,
  effects: reactNativeEffects,
  fakeTimerScope: reactNativeFakeTimerScope,
  createFakeTimerScopedRegistries: createReactNativeFakeTimerScopedRegistries,
  getFailureSnapshot,
});

export { actions, assertions, query, given, effect, withFakeTimers };
export { cleanupReactRoots, defaultGivens, reactNativeEffects, reactNativeFakeTimerScope };
