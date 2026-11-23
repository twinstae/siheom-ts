import { configure } from "@testing-library/dom";
import * as React from "react";

declare global {
  // Read by React to decide whether updates outside act() should warn.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

configure({
  asyncWrapper: async (callback) => {
    let result: unknown;
    await React.act(async () => {
      result = await callback();
    });
    await React.act(async () => {
      await new Promise<void>((resolve) => {
        queueMicrotask(resolve);
      });
    });
    return result;
  },
  unstable_advanceTimersWrapper: (callback) => {
    let result: unknown;
    React.act(() => {
      result = callback();
    });
    return result;
  },
});
