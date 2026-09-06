import { vi } from "vitest";
import type {
  ActionStepDefinitionDict,
  AssertionStepDefinitionDict,
  EffectStepDefinitionDict,
  GivenStepDefinitionDict,
} from "@siheom/core";
import { createDefaultActions } from "./action.js";
import { createDefaultAssertions } from "./assert.js";

/** Keep in sync with @siheom/core fakeTimerScope. */
export const FAKE_TIMER_USER_DELAY_MS = 50;

export type SiheomRegistryBundle<
  TActions extends ActionStepDefinitionDict = ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict = AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict = GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict = EffectStepDefinitionDict,
> = {
  actions: TActions;
  assertions: TAssertions;
  givens: TGivens;
  effects: TEffects;
};

function wrapActionsAfterHook<TActions extends ActionStepDefinitionDict>(
  actions: TActions,
  afterAction: () => void | Promise<void>,
): TActions {
  const wrapped = {} as Record<string, ActionStepDefinitionDict[string]>;

  for (const name of Object.keys(actions)) {
    const run = actions[name]!;
    wrapped[name] = async (...args: Parameters<typeof run>) => {
      await run(...args);
      await afterAction();
    };
  }

  return wrapped as TActions;
}

export function createFakeTimerScopedRegistries<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(
  registries: SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects>,
): SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects> {
  const afterAction = async () => {
    await vi.advanceTimersByTimeAsync(FAKE_TIMER_USER_DELAY_MS);
  };
  const actions = wrapActionsAfterHook(
    createDefaultActions({ resolveElement: "sync" }),
    afterAction,
  ) as unknown as TActions;

  return {
    ...registries,
    actions,
    assertions: createDefaultAssertions({ resolveElement: "sync" }) as unknown as TAssertions,
  };
}
