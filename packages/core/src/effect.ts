import { vi } from "vitest";
import type { EffectStep, EffectStepDefinitionDict } from "./types.js";

export const defaultEffects = {
  elapsed: async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
  },
  runAllTimers: async () => {
    await vi.runAllTimersAsync();
  },
} satisfies EffectStepDefinitionDict;

export const effect = {
  elapsed: (ms: number): EffectStep<typeof defaultEffects> => ({
    effect: "elapsed",
    args: [ms],
    log: `elapsed: ${ms}ms`,
  }),
  runAllTimers: (): EffectStep<typeof defaultEffects> => ({
    effect: "runAllTimers",
    log: "runAllTimers",
  }),
};
