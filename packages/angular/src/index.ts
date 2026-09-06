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
import { angularEffects } from "./effects.js";
import { angularFakeTimerScope } from "./fakeTimerScope.js";

export const runSiheom = createRunSiheom({
  actions: defaultActions,
  assertions: defaultAssertions,
  givens: defaultGivens,
  effects: angularEffects,
  fakeTimerScope: angularFakeTimerScope,
});

export { actions, assertions, query, given, effect, withFakeTimers };
export { defaultGivens, angularEffects, angularFakeTimerScope };
