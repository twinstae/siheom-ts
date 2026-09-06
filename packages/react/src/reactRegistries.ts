import {
  createDefaultActions,
  createDefaultAssertions,
  createFakeTimerScopedRegistries,
  type ActionStepDefinitionDict,
  type AssertionStepDefinitionDict,
  type EffectStepDefinitionDict,
  type GivenStepDefinitionDict,
  type SiheomRegistryBundle,
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

export const reactActions = wrapInActAsync(createDefaultActions()) as ActionStepDefinitionDict;
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
