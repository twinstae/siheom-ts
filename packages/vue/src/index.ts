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
import { vueEffects } from "./effects.js";
import { vueFakeTimerScope } from "./fakeTimerScope.js";

export const runSiheom = createRunSiheom({
  actions: defaultActions,
  assertions: defaultAssertions,
  givens: defaultGivens,
  effects: vueEffects,
  fakeTimerScope: vueFakeTimerScope,
});

export { actions, assertions, query, given, effect, withFakeTimers };
export { defaultGivens, vueEffects, vueFakeTimerScope };
