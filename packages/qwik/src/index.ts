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
import { qwikEffects } from "./effects.js";
import { qwikFakeTimerScope } from "./fakeTimerScope.js";

export const runSiheom = createRunSiheom({
  actions: defaultActions,
  assertions: defaultAssertions,
  givens: defaultGivens,
  effects: qwikEffects,
  fakeTimerScope: qwikFakeTimerScope,
});

export { actions, assertions, query, given, effect, withFakeTimers };
export { defaultGivens, qwikEffects, qwikFakeTimerScope };
