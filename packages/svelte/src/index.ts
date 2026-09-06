import {
  actions,
  assertions,
  createRunSiheom,
  defaultActions,
  defaultAssertions,
  effect,
  query,
  withFakeTimers,
} from "@siheom/core";
import { defaultGivens, given } from "./given.js";
import { svelteEffects } from "./effects.js";
import { svelteFakeTimerScope } from "./fakeTimerScope.js";

export const runSiheom = createRunSiheom({
  actions: defaultActions,
  assertions: defaultAssertions,
  givens: defaultGivens,
  effects: svelteEffects,
  fakeTimerScope: svelteFakeTimerScope,
});

export { actions, assertions, query, given, effect, withFakeTimers };
export { defaultGivens, svelteEffects, svelteFakeTimerScope };
