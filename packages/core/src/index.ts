export { createRunSiheom } from "./siheom.ts";
export type { SiheomRegistries } from "./siheom.ts";
export { defaultMessageMap, formatFailureReport, resolveMessageMap } from "./messages.ts";
export type { MessageMap } from "./messages.ts";
export { extendSiheom, overrideSiheom } from "./factory.ts";
export type { SiheomBindings, SiheomFactoryRegistries } from "./factory.ts";
export { query, getElement } from "./query.ts";
export { actions, defaultActions, createDefaultActions } from "./action.ts";
export type { DefaultActions, SiheomUser } from "./action.ts";
export { assertions, defaultAssertions, createDefaultAssertions } from "./assert.ts";
export type { DefaultAssertions } from "./assert.ts";
export { effect, defaultEffects } from "./effect.ts";
export { withFakeTimers } from "./withFakeTimers.ts";
export {
  FAKE_TIMER_USER_DELAY_MS,
  wrapActionsAfterHook,
  createFakeTimerScopedRegistries,
} from "./fakeTimerScope.ts";
export type {
  FakeTimerScopeHooks,
  AfterActionHook,
  SiheomRegistryBundle,
} from "./fakeTimerScope.ts";
export { dispatchDragAndDrop } from "./dispatchDragAndDrop.ts";
export type {
  ActionStep,
  ActionStepDefinitionDict,
  AssertionStep,
  AssertionStepDefinitionDict,
  EffectStep,
  EffectStepDefinitionDict,
  FakeTimersScopeStep,
  GivenStep,
  GivenStepDefinitionDict,
  Locator,
  Step,
} from "./types.ts";

import { createRunSiheom } from "./siheom.ts";
import { defaultActions } from "./action.ts";
import { defaultAssertions } from "./assert.ts";
import { defaultEffects } from "./effect.ts";
import type { GivenStepDefinitionDict } from "./types.ts";

/** Core runner without framework givens (actions + assertions only). */
export const runSiheom = createRunSiheom({
  actions: defaultActions,
  assertions: defaultAssertions,
  givens: {} as GivenStepDefinitionDict,
  effects: defaultEffects,
});
