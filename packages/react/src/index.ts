import {
  actions,
  assertions,
  createRunSiheom,
  effect,
  query,
  withFakeTimers,
  type SiheomUser,
} from "@siheom/core";
import { cleanupReactRoots, defaultGivens, given } from "./given.ts";
import { reactEffects } from "./effects.ts";
import { reactFakeTimerScope } from "./fakeTimerScope.ts";
import {
  createReactActions,
  createReactFakeTimerScopedRegistries,
  reactAssertions,
} from "./reactRegistries.ts";

export type CreateReactSiheomOptions = {
  /**
   * Drives `actions.*`. Defaults to `@testing-library/user-event` (synthetic events).
   * In Vitest browser mode, pass `userEvent` from `vitest/browser` for real, trusted input
   * (needed by "interact outside" detection such as Ark UI / zag popovers and menus).
   */
  user?: SiheomUser;
};

export function createReactSiheom(options: CreateReactSiheomOptions = {}) {
  return {
    runSiheom: createRunSiheom({
      actions: createReactActions(options.user),
      assertions: reactAssertions,
      givens: defaultGivens,
      effects: reactEffects,
      fakeTimerScope: reactFakeTimerScope,
      createFakeTimerScopedRegistries: createReactFakeTimerScopedRegistries,
    }),
  };
}

export const { runSiheom } = createReactSiheom();

export { actions, assertions, query, given, effect, withFakeTimers };
export { defaultGivens, cleanupReactRoots, reactEffects, reactFakeTimerScope };
