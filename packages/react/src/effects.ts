import { actAsync } from "./actAsync.js";
import { vi } from "vitest";
import type { EffectStepDefinitionDict } from "@siheom/core";

export const reactEffects = {
  elapsed: async (ms: number) => {
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  },
  runAllTimers: async () => {
    await actAsync(async () => {
      await vi.runAllTimersAsync();
    });
  },
} satisfies EffectStepDefinitionDict;
