import { cleanup, render } from "@testing-library/react-native";
import type { GivenStep } from "@siheom/core";
import type { ReactElement } from "react";
import { setLastRender } from "./query.js";

export async function cleanupReactRoots(): Promise<void> {
  await cleanup();
  setLastRender(null);
}

export const defaultGivens = {
  render: async (element: ReactElement) => {
    const result = await render(element);
    setLastRender(result);
  },
};

export const given = {
  render: (element: ReactElement): GivenStep<typeof defaultGivens> => ({
    given: "render",
    log: "렌더한다",
    args: [element],
  }),
};
