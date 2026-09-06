import { FAKE_TIMER_USER_DELAY_MS } from "./fakeTimerRegistries.js";
import { vi } from "vitest";

export { FAKE_TIMER_USER_DELAY_MS };

export const reactNativeFakeTimerScope = {
  installFakeTimers: () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  },
  afterAction: async () => {
    await vi.advanceTimersByTimeAsync(FAKE_TIMER_USER_DELAY_MS);
  },
};
