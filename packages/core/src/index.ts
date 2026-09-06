export { createRunSiheom } from "./siheom.js";
export type { SiheomRegistries } from "./siheom.js";
export { defaultMessageMap, formatFailureReport, resolveMessageMap } from "./messages.js";
export type { MessageMap } from "./messages.js";
export { extendSiheom, overrideSiheom } from "./factory.js";
export type { SiheomBindings, SiheomFactoryRegistries } from "./factory.js";
export { query, getElement, locatorLog } from "./query.js";
export { actions, defaultActions, createDefaultActions } from "./action.js";
export type { DefaultActions } from "./action.js";
export { assertions, defaultAssertions, createDefaultAssertions } from "./assert.js";
export type { DefaultAssertions } from "./assert.js";
export type { A11ySnapshotOptions } from "./getA11ySnapshot.js";
export { getA11ySnapshot } from "./getA11ySnapshot.js";
export { tableToMarkdown } from "./tableToMarkdown.js";
export { effect, defaultEffects } from "./effect.js";
export { withFakeTimers } from "./withFakeTimers.js";
export {
  FAKE_TIMER_USER_DELAY_MS,
  wrapActionsAfterHook,
  createFakeTimerScopedRegistries,
} from "./fakeTimerScope.js";
export type {
  FakeTimerScopeHooks,
  AfterActionHook,
  SiheomRegistryBundle,
} from "./fakeTimerScope.js";
export { dispatchDragAndDrop } from "./dispatchDragAndDrop.js";
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
} from "./types.js";

import { createRunSiheom } from "./siheom.js";
import { defaultActions } from "./action.js";
import { defaultAssertions } from "./assert.js";
import { defaultEffects } from "./effect.js";
import type { GivenStepDefinitionDict } from "./types.js";

/** Core runner without framework givens (actions + assertions only). */
export const runSiheom = createRunSiheom({
  actions: defaultActions,
  assertions: defaultAssertions,
  givens: {} as GivenStepDefinitionDict,
  effects: defaultEffects,
});
