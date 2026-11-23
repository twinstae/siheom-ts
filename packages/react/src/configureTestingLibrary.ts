import { configure } from "@testing-library/dom";
import * as React from "react";

declare global {
  // Read by React to decide whether updates outside act() should warn.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

configure({
  // Like @testing-library/react: while `waitFor` polls, React must render updates as they
  // happen. Inside an `act` scope they would stay queued until the scope ends, i.e. until the
  // wait had already failed. So poll outside `act`, with the act environment off to avoid
  // "not wrapped in act" warnings, then restore it.
  asyncWrapper: async (callback) => {
    const previous = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      const result = await callback();
      // Let work that settled during the wait flush before act() checks resume.
      await new Promise<void>((resolve) => {
        queueMicrotask(resolve);
      });
      return result;
    } finally {
      globalThis.IS_REACT_ACT_ENVIRONMENT = previous;
    }
  },
  unstable_advanceTimersWrapper: (callback) => {
    let result: unknown;
    React.act(() => {
      result = callback();
    });
    return result;
  },
});
