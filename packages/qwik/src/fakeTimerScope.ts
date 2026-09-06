import { userEvent } from "@testing-library/user-event";
import { FAKE_TIMER_USER_DELAY_MS } from "@siheom/core";
import { vi } from "vitest";

/**
 * Qwik QRL handlers need real user-event completion; `advanceTimers` breaks
 * async click resolution. Rely on `shouldAdvanceTime: true` instead.
 */
export const qwikFakeTimerScope = {
  installFakeTimers: () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  },
  createUser: () => userEvent.setup(),
  afterAction: async () => {
    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(FAKE_TIMER_USER_DELAY_MS);
  },
};
