import { vi } from "vitest";
import { userEvent, type UserEvent } from "@testing-library/user-event";
import { createDefaultActions } from "./action.js";
import type { MessageMap } from "./messages.js";
import type {
  ActionStepDefinitionDict,
  AssertionStepDefinitionDict,
  EffectStepDefinitionDict,
  GivenStepDefinitionDict,
} from "./types.js";

/** Simulated pause after a user action inside `withFakeTimers`. */
export const FAKE_TIMER_USER_DELAY_MS = 50;

export type AfterActionHook = () => void | Promise<void>;

export type FakeTimerScopeHooks<TGivens extends GivenStepDefinitionDict = GivenStepDefinitionDict> =
  {
    /** Override how fake timers are installed for this scope (e.g. React needs `shouldAdvanceTime: true`). */
    installFakeTimers?: () => void;
    createUser?: (advanceTimers: (delay: number) => void) => UserEvent;
    afterAction?: AfterActionHook;
    wrapGivens?: (givens: TGivens) => TGivens;
  };

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
  messages?: MessageMap;
  fakeTimerScope?: FakeTimerScopeHooks;
};

export function wrapActionsAfterHook<TActions extends ActionStepDefinitionDict>(
  actions: TActions,
  afterAction: AfterActionHook,
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
  const advanceTimers = (delay: number) => {
    vi.advanceTimersByTime(delay);
  };
  const user =
    registries.fakeTimerScope?.createUser?.(advanceTimers) ?? userEvent.setup({ advanceTimers });
  const afterAction =
    registries.fakeTimerScope?.afterAction ??
    (async () => {
      await vi.advanceTimersByTimeAsync(FAKE_TIMER_USER_DELAY_MS);
    });
  const actions = wrapActionsAfterHook(
    createDefaultActions({ user, resolveElement: "sync" }),
    afterAction,
  ) as unknown as TActions;

  return {
    ...registries,
    actions,
    givens: (registries.fakeTimerScope?.wrapGivens?.(registries.givens) ??
      registries.givens) as TGivens,
  };
}
