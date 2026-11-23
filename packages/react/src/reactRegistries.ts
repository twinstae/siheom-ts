import {
  createDefaultActions,
  createDefaultAssertions,
  createFakeTimerScopedRegistries,
  type ActionStepDefinitionDict,
  type AssertionStepDefinitionDict,
  type EffectStepDefinitionDict,
  type GivenStepDefinitionDict,
  type SiheomRegistryBundle,
  type SiheomUser,
} from "@siheom/core";
import { actAsync } from "./actAsync.js";

function wrapInActAsync<T extends Record<string, (...args: never[]) => Promise<void>>>(
  implementations: T,
): T {
  return Object.fromEntries(
    Object.entries(implementations).map(([name, run]) => [
      name,
      (...args: Parameters<typeof run>) => actAsync(() => run(...args)),
    ]),
  ) as T;
}

export function createReactActions(user?: SiheomUser) {
  return wrapInActAsync(createDefaultActions({ user }));
}

export const reactActions = createReactActions();
/**
 * Assertions are not wrapped in `act`. They poll with `waitFor`, and React holds updates queued
 * inside an `act` scope until the scope ends — so a state update that settles while an assertion
 * waits (a fetch, `file.text()`, a timer) would never render until the assertion had timed out.
 * `configureTestingLibrary` turns the act environment off while `waitFor` polls instead.
 */
export const reactAssertions = createDefaultAssertions();

export function createReactFakeTimerScopedRegistries<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(
  registries: SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects>,
): SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects> {
  const scoped = createFakeTimerScopedRegistries(registries);
  return {
    ...scoped,
    actions: wrapInActAsync(scoped.actions) as TActions,
  };
}
