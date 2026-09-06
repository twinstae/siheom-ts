import { vi } from "vitest";
import { defaultFailureSnapshot, runLoggedStep, wrapStepError } from "./runner.js";
import { query as queryObject, locatorLog } from "./query.js";
import type { LocatorTargetStep, OmitIndexSignature } from "./factory.js";
import type { SiheomRegistries } from "./siheom.js";
import type {
  ActionStepDefinitionDict,
  AssertionStepDefinitionDict,
  EffectStepDefinitionDict,
  GivenStepDefinitionDict,
  Locator,
} from "./types.js";
import { defaultActions } from "./action.js";
import { defaultAssertions } from "./assert.js";
import { defaultEffects } from "./effect.js";

/**
 * Default assertion keys whose registry implementation is
 * `(target, expected: boolean) => Promise<void>`. The imperative bindings
 * expose them ergonomically: `assertions.visible(target)` asserts `true` and
 * `assertions.not.visible(target)` asserts `false`, mirroring the declarative
 * step builders. Keys outside these lists pass through with their registry
 * argument signatures.
 */
const BOOLEAN_ASSERTIONS = [
  "visible",
  "checked",
  "expanded",
  "selected",
  "disabled",
  "focused",
] as const;

/**
 * Default assertion keys whose registry implementation is
 * `(target, arg, flag = true) => Promise<void>`. The imperative bindings expose
 * them as `assertions.value(target, expected)` (flag `true`) and
 * `assertions.not.value(target, expected)` (flag `false`).
 */
const FLAG_ASSERTIONS = [
  "current",
  "count",
  "value",
  "href",
  "errormessage",
  "textContent",
] as const;

type BooleanAssertionKey = (typeof BOOLEAN_ASSERTIONS)[number];
type FlagAssertionKey = (typeof FLAG_ASSERTIONS)[number];

export type ImperativeTargetBindings<TSteps extends Record<string, LocatorTargetStep>> = {
  [K in keyof OmitIndexSignature<TSteps>]: OmitIndexSignature<TSteps>[K] extends (
    target: Locator,
    ...args: infer Args
  ) => Promise<void>
    ? (target: Locator, ...args: Args) => Promise<void>
    : never;
};

type ImperativeAssertionBindings<TAssertions extends AssertionStepDefinitionDict> = {
  [K in keyof OmitIndexSignature<TAssertions>]: K extends BooleanAssertionKey
    ? (target: Locator) => Promise<void>
    : K extends FlagAssertionKey
      ? OmitIndexSignature<TAssertions>[K] extends (
          target: Locator,
          arg: infer Arg,
          flag?: boolean,
        ) => Promise<void>
        ? (target: Locator, arg: Arg) => Promise<void>
        : never
      : OmitIndexSignature<TAssertions>[K] extends (
          target: Locator,
          ...args: infer Args
        ) => Promise<void>
        ? (target: Locator, ...args: Args) => Promise<void>
        : never;
};

type ImperativeNotAssertionBindings<TAssertions extends AssertionStepDefinitionDict> = {
  [K in keyof OmitIndexSignature<TAssertions> &
    (BooleanAssertionKey | FlagAssertionKey)]: K extends BooleanAssertionKey
    ? (target: Locator) => Promise<void>
    : OmitIndexSignature<TAssertions>[K] extends (
        target: Locator,
        arg: infer Arg,
        flag?: boolean,
      ) => Promise<void>
      ? (target: Locator, arg: Arg) => Promise<void>
      : never;
};

export type ImperativeArgsBindings<TSteps extends Record<string, (...args: never[]) => Promise<void>>> =
  {
    [K in keyof OmitIndexSignature<TSteps>]: OmitIndexSignature<TSteps>[K] extends (
      ...args: infer Args
    ) => Promise<void>
      ? (...args: Args) => Promise<void>
      : never;
  };

export type ImperativeSiheom<
  TActions extends ActionStepDefinitionDict = ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict = AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict = GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict = EffectStepDefinitionDict,
> = {
  /** Declarative locator data shared with the step-based API. */
  query: typeof queryObject;
  actions: ImperativeTargetBindings<TActions>;
  assertions: ImperativeAssertionBindings<TAssertions> & {
    not: ImperativeNotAssertionBindings<TAssertions>;
  };
  given: ImperativeArgsBindings<TGivens>;
  effect: ImperativeArgsBindings<TEffects>;
  /** Runs the callback under fake timers with scoped registries. */
  withFakeTimers: (
    run: (siheom: ImperativeSiheom<TActions, TAssertions, TGivens, TEffects>) => Promise<void>,
  ) => Promise<void>;
  /** Discard accumulated step logs (start of a new scenario). */
  clearLogs: () => void;
};

export type CreateImperativeSiheomOptions = {
  /** Shared step log; defaults to a fresh array. Passed down to keep fake-timer scopes in one log. */
  logs?: string[];
};

export function createImperativeSiheom<
  TActions extends ActionStepDefinitionDict,
  TAssertions extends AssertionStepDefinitionDict,
  TGivens extends GivenStepDefinitionDict,
  TEffects extends EffectStepDefinitionDict,
>(
  registries: SiheomRegistries<TActions, TAssertions, TGivens, TEffects>,
  options: CreateImperativeSiheomOptions = {},
): ImperativeSiheom<TActions, TAssertions, TGivens, TEffects> {
  const logs = options.logs ?? [];
  const getFailureSnapshot = registries.getFailureSnapshot ?? defaultFailureSnapshot;
  const handleError = (error: Error): never =>
    wrapStepError(logs, error, getFailureSnapshot, registries.messages);

  async function runAction(name: string, target: Locator, args: readonly unknown[]) {
    const run = registries.actions[name] as ActionStepDefinitionDict[string];
    await runLoggedStep(logs, `${name}: ${locatorLog(target)}`, handleError, () =>
      run(target, ...args),
    );
  }

  async function runAssertion(name: string, target: Locator, args: readonly unknown[]) {
    const run = registries.assertions[name] as AssertionStepDefinitionDict[string];
    await runLoggedStep(logs, `${name}: ${locatorLog(target)}`, handleError, () =>
      run(target, ...args),
    );
  }

  async function runGiven(name: string, args: readonly unknown[]) {
    const run = registries.givens[name] as (...args: readonly unknown[]) => Promise<void>;
    await runLoggedStep(logs, name, handleError, () => run(...args));
  }

  async function runEffect(name: string, args: readonly unknown[]) {
    const run = registries.effects[name] as EffectStepDefinitionDict[string];
    const log = args.length > 0 ? `${name}: ${args.join(", ")}` : name;
    await runLoggedStep(logs, log, handleError, () => run(...args));
  }

  function buildActions(): ImperativeTargetBindings<TActions> {
    const result = {} as Record<string, (target: Locator, ...args: unknown[]) => Promise<void>>;
    for (const name of Object.keys(registries.actions)) {
      result[name] = (target: Locator, ...args: unknown[]) => runAction(name, target, args);
    }
    return result as ImperativeTargetBindings<TActions>;
  }

  function buildAssertions(): ImperativeAssertionBindings<TAssertions> & {
    not: ImperativeNotAssertionBindings<TAssertions>;
  } {
    const result = {} as Record<string, (target: Locator, ...args: unknown[]) => Promise<void>>;
    const not = {} as Record<string, (target: Locator, ...args: unknown[]) => Promise<void>>;
    for (const name of Object.keys(registries.assertions)) {
      if ((BOOLEAN_ASSERTIONS as readonly string[]).includes(name)) {
        result[name] = (target: Locator) => runAssertion(name, target, [true]);
        not[name] = (target: Locator) => runAssertion(name, target, [false]);
      } else if ((FLAG_ASSERTIONS as readonly string[]).includes(name)) {
        result[name] = (target: Locator, arg: unknown) => runAssertion(name, target, [arg, true]);
        not[name] = (target: Locator, arg: unknown) => runAssertion(name, target, [arg, false]);
      } else {
        result[name] = (target: Locator, ...args: unknown[]) => runAssertion(name, target, args);
      }
    }
    return { ...result, not } as ImperativeAssertionBindings<TAssertions> & {
      not: ImperativeNotAssertionBindings<TAssertions>;
    };
  }

  function buildGiven(): ImperativeArgsBindings<TGivens> {
    const result = {} as Record<string, (...args: unknown[]) => Promise<void>>;
    for (const name of Object.keys(registries.givens)) {
      result[name] = (...args: unknown[]) => runGiven(name, args);
    }
    return result as ImperativeArgsBindings<TGivens>;
  }

  function buildEffect(): ImperativeArgsBindings<TEffects> {
    const result = {} as Record<string, (...args: unknown[]) => Promise<void>>;
    for (const name of Object.keys(registries.effects)) {
      result[name] = (...args: unknown[]) => runEffect(name, args);
    }
    return result as ImperativeArgsBindings<TEffects>;
  }

  const siheom: ImperativeSiheom<TActions, TAssertions, TGivens, TEffects> = {
    query: queryObject,
    actions: buildActions(),
    assertions: buildAssertions(),
    given: buildGiven(),
    effect: buildEffect(),
    withFakeTimers: async (run) => {
      const installFakeTimers =
        registries.fakeTimerScope?.installFakeTimers ??
        (() => {
          vi.useFakeTimers({ shouldAdvanceTime: false });
        });
      installFakeTimers();
      try {
        const { createFakeTimerScopedRegistries: createDefaultScopedRegistries } = await import(
          "./fakeTimerScope.js"
        );
        const scopeRegistries =
          registries.createFakeTimerScopedRegistries ?? createDefaultScopedRegistries;
        const scopedRegistries = scopeRegistries(registries);
        const scopedSiheom = createImperativeSiheom(scopedRegistries, { logs });
        await run(scopedSiheom);
      } finally {
        vi.useRealTimers();
      }
    },
    clearLogs: () => {
      logs.length = 0;
    },
  };

  return siheom;
}

/**
 * Imperative bindings over the core default registries (actions + assertions +
 * effects; no framework givens). Prefer `createImperativeSiheom` for a fresh
 * instance per test so failure logs never leak across tests.
 */
const coreImperative = createImperativeSiheom({
  actions: defaultActions,
  assertions: defaultAssertions,
  givens: {} as GivenStepDefinitionDict,
  effects: defaultEffects,
});

export const actions = coreImperative.actions;
export const assertions = coreImperative.assertions;
export const effect = coreImperative.effect;
export const query = coreImperative.query;
export const withFakeTimers = coreImperative.withFakeTimers;
export const clearLogs = coreImperative.clearLogs;