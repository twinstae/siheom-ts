import {
  FAKE_TIMER_USER_DELAY_MS,
  wrapActionsAfterHook,
  type SiheomRegistryBundle,
} from "@siheom/core";
import { vi } from "vitest";
import { createBrowserActions } from "./action.js";

export function createBrowserFakeTimerScopedRegistries<
  TActions extends import("@siheom/core").ActionStepDefinitionDict,
  TAssertions extends import("@siheom/core").AssertionStepDefinitionDict,
  TGivens extends import("@siheom/core").GivenStepDefinitionDict,
  TEffects extends import("@siheom/core").EffectStepDefinitionDict,
>(
  registries: SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects>,
): SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects> {
  const afterAction =
    registries.fakeTimerScope?.afterAction ??
    (async () => {
      await vi.advanceTimersByTimeAsync(FAKE_TIMER_USER_DELAY_MS);
    });
  const actions = wrapActionsAfterHook(
    createBrowserActions({ resolveElement: "sync" }),
    afterAction,
  ) as TActions;

  return {
    ...registries,
    actions,
    givens: (registries.fakeTimerScope?.wrapGivens?.(registries.givens) ??
      registries.givens) as TGivens,
  };
}
