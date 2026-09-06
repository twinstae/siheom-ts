import type {
  ActionStepDefinitionDict,
  AssertionStepDefinitionDict,
  EffectStepDefinitionDict,
  FakeTimersScopeStep,
  GivenStepDefinitionDict,
  Step,
} from "./types.js";

export function withFakeTimers<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(
  ...steps: Step<TActions, TAssertions, TGivens, TEffects>[]
): FakeTimersScopeStep<TActions, TAssertions, TGivens, TEffects> {
  return {
    scope: "fakeTimers",
    steps,
    log: "withFakeTimers",
  };
}
