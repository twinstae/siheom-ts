import { FAKE_TIMER_USER_DELAY_MS } from "@siheom/core";
import { actAsync } from "./actAsync.js";
import { vi } from "vitest";

/**
 * React + user-event hang under fake timers unless timers also advance with
 * wall-clock time (`shouldAdvanceTime: true`). Explicit `effect.elapsed` still
 * jumps fake time for app timers.
 */
export const reactFakeTimerScope = {
  installFakeTimers: () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  },
  afterAction: async () => {
    await actAsync(async () => {
      await vi.advanceTimersByTimeAsync(FAKE_TIMER_USER_DELAY_MS);
    });
  },
};
