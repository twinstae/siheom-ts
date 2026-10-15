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
import { actAsync } from "./actAsync.ts";

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

export function createReactActions(user?: SiheomUser): ActionStepDefinitionDict {
  return wrapInActAsync(createDefaultActions({ user })) as ActionStepDefinitionDict;
}

export const reactActions = createReactActions();
export const reactAssertions = wrapInActAsync(
  createDefaultAssertions(),
) as AssertionStepDefinitionDict;

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
