import { vi } from "vitest";
import type {
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
import { getA11ySnapshot } from "./getA11ySnapshot.js";
import { formatFailureReport, type MessageMap } from "./messages.js";
import type { FakeTimerScopeHooks, SiheomRegistryBundle } from "./fakeTimerScope.js";

export type { FakeTimerScopeHooks, SiheomRegistryBundle } from "./fakeTimerScope.js";

export type SiheomRegistries<
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
  createFakeTimerScopedRegistries?: <
    TActions extends ActionStepDefinitionDict,
    TAssertions extends AssertionStepDefinitionDict,
    TGivens extends GivenStepDefinitionDict,
    TEffects extends EffectStepDefinitionDict,
  >(
    registries: SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects>,
  ) => SiheomRegistryBundle<TActions, TAssertions, TGivens, TEffects>;
  getFailureSnapshot?: () => string;
};

function defaultFailureSnapshot(): string {
  if (typeof document === "undefined") {
    return "";
  }

  return getA11ySnapshot(document.body);
}

function wrapStepError(
  logs: string[],
  error: Error,
  getFailureSnapshot: () => string,
  messages: MessageMap | undefined,
): never {
  throw new Error(formatFailureReport(logs, error, getFailureSnapshot(), messages));
}

async function runLoggedStep(
  logs: string[],
  log: string,
  handleError: (error: Error) => never,
  run: () => Promise<void>,
): Promise<void> {
  logs.push(log);
  await run().catch(handleError);
}

async function runActionStep<TActions extends ActionStepDefinitionDict>(
  step: ActionStep<TActions>,
  registries: { actions: TActions },
  logs: string[],
  handleError: (error: Error) => never,
): Promise<void> {
  const run = registries.actions[step.action] as ActionStepDefinitionDict[string];
  await runLoggedStep(logs, step.log, handleError, () => run(step.target, ...(step.args ?? [])));
}

async function runGivenStep<TGivens extends GivenStepDefinitionDict>(
  step: GivenStep<TGivens>,
  registries: { givens: TGivens },
  logs: string[],
  handleError: (error: Error) => never,
): Promise<void> {
  const run = registries.givens[step.given] as (...args: readonly unknown[]) => Promise<void>;
  await runLoggedStep(logs, step.log, handleError, () => run(...(step.args ?? [])));
}

async function runEffectStep<TEffects extends EffectStepDefinitionDict>(
  step: EffectStep<TEffects>,
  registries: { effects: TEffects },
  logs: string[],
  handleError: (error: Error) => never,
): Promise<void> {
  const run = registries.effects[step.effect] as EffectStepDefinitionDict[string];
  await runLoggedStep(logs, step.log, handleError, () => run(...(step.args ?? [])));
}

async function runAssertStep<TAssertions extends AssertionStepDefinitionDict>(
  step: AssertionStep<TAssertions>,
  registries: { assertions: TAssertions },
  logs: string[],
  handleError: (error: Error) => never,
): Promise<void> {
  const run = registries.assertions[step.assert] as (
    locator: Locator,
    ...args: readonly unknown[]
  ) => Promise<void>;
  await runLoggedStep(logs, step.log, handleError, () => run(step.target, ...(step.args ?? [])));
}

async function runOneStep<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(
  step: Step<TActions, TAssertions, TGivens, TEffects>,
  registries: SiheomRegistries<TActions, TAssertions, TGivens, TEffects>,
  logs: string[],
  handleError: (error: Error) => never,
): Promise<void> {
  if ("scope" in step) {
    await runFakeTimersScope(step, registries, logs);
    return;
  }
  if ("action" in step) {
    await runActionStep(step, registries, logs, handleError);
    return;
  }
  if ("given" in step) {
    await runGivenStep(step, registries, logs, handleError);
    return;
  }
  if ("effect" in step) {
    await runEffectStep(step, registries, logs, handleError);
    return;
  }
  if ("assert" in step) {
    await runAssertStep(step, registries, logs, handleError);
    return;
  }
  throw new Error("Invalid step");
}

async function runSteps<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(
  registries: SiheomRegistries<TActions, TAssertions, TGivens, TEffects>,
  steps: Step<TActions, TAssertions, TGivens, TEffects>[],
  logs: string[],
) {
  const getFailureSnapshot = registries.getFailureSnapshot ?? defaultFailureSnapshot;
  const handleError = (error: Error) =>
    wrapStepError(logs, error, getFailureSnapshot, registries.messages);

  for (const step of steps) {
    await runOneStep(step, registries, logs, handleError);
  }
}

async function runFakeTimersScope<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(
  scope: FakeTimersScopeStep<TActions, TAssertions, TGivens, TEffects>,
  registries: SiheomRegistries<TActions, TAssertions, TGivens, TEffects>,
  logs: string[],
) {
  const installFakeTimers =
    registries.fakeTimerScope?.installFakeTimers ??
    (() => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
    });
  installFakeTimers();
  try {
    const { createFakeTimerScopedRegistries: createDefaultScopedRegistries } =
      await import("./fakeTimerScope.js");
    const scopeRegistries =
      registries.createFakeTimerScopedRegistries ?? createDefaultScopedRegistries;
    const scopedRegistries = scopeRegistries(registries);
    await runSteps(scopedRegistries, scope.steps.flat(), logs);
  } finally {
    vi.useRealTimers();
  }
}

export function createRunSiheom<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(registries: SiheomRegistries<TActions, TAssertions, TGivens, TEffects>) {
  return async function runSiheom(
    ...steps: (
      | Step<TActions, TAssertions, TGivens, TEffects>
      | Step<TActions, TAssertions, TGivens, TEffects>[]
    )[]
  ) {
    const logs: string[] = [];
    await runSteps(registries, steps.flat(), logs);
  };
}
