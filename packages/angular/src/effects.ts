import { vi } from "vitest";
import type { EffectStepDefinitionDict } from "@siheom/core";
import { detectChanges } from "./given.js";

export const angularEffects = {
  elapsed: async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    detectChanges();
  },
  runAllTimers: async () => {
    await vi.runAllTimersAsync();
    detectChanges();
  },
} satisfies EffectStepDefinitionDict;
