import { describe, it } from "vitest";
import { useState } from "react";
import { userEvent } from "vitest/browser";
import { actions, assertions, createReactSiheom, given, query } from "./index.ts";

function TrustedPointerProbe() {
  const [trusted, setTrusted] = useState("unknown");

  return (
    <>
      <button type="button" onPointerDown={(event) => setTrusted(String(event.isTrusted))}>
        누르기
      </button>
      <output aria-label="trusted">{trusted}</output>
    </>
  );
}

describe("createReactSiheom", () => {
  it("runs actions with the injected user (vitest/browser userEvent → trusted input)", async () => {
    const { runSiheom } = createReactSiheom({ user: userEvent });

    await runSiheom(
      given.render(<TrustedPointerProbe />),
      actions.click(query.button("누르기")),
      assertions.textContent(query.status("trusted"), "true"),
    );
  });
});
