import { describe, it } from "vitest";
import { useState } from "react";
import { actions, assertions, given, query, runSiheom } from "./index.ts";

/** Clicking starts async work (like `file.text()` or `fetch`) that sets state ~100ms later. */
function DelayedLabel() {
  const [label, setLabel] = useState("waiting");

  return (
    <button
      type="button"
      onClick={async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setLabel("done");
      }}
    >
      {label}
    </button>
  );
}

describe("assertions and async state updates", () => {
  it("sees a state update that settles while the assertion is waiting", async () => {
    await runSiheom(
      given.render(<DelayedLabel />),
      actions.click(query.button("waiting")),
      assertions.visible(query.button("done")),
    );
  });
});
