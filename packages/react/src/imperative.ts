import { createImperativeSiheom } from "@siheom/core";
import { cleanupReactRoots, defaultGivens } from "./given.js";
import { reactEffects } from "./effects.js";
import { reactFakeTimerScope } from "./fakeTimerScope.js";
import {
  createReactFakeTimerScopedRegistries,
  reactActions,
  reactAssertions,
} from "./reactRegistries.js";

const registries = {
  actions: reactActions,
  assertions: reactAssertions,
  givens: defaultGivens,
  effects: reactEffects,
  fakeTimerScope: reactFakeTimerScope,
  createFakeTimerScopedRegistries: createReactFakeTimerScopedRegistries,
};

export const siheom = createImperativeSiheom(registries);

// A `given.render` starts a new scenario: discard step logs from previous
// tests so failure reports never leak across `it` blocks.
const render = siheom.given.render;
siheom.given.render = (element) => {
  siheom.clearLogs();
  return render(element);
};

export const actions = siheom.actions;
export const assertions = siheom.assertions;
export const given = siheom.given;
export const effect = siheom.effect;
export const query = siheom.query;
export const withFakeTimers = siheom.withFakeTimers;
export { cleanupReactRoots };
