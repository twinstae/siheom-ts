import { afterEach, describe, expect, it } from "vitest";
import { useEffect, useState } from "react";
import {
  actions,
  assertions,
  cleanupReactRoots,
  effect,
  given,
  query,
  withFakeTimers,
} from "./imperative.ts";

async function captureError(run: () => Promise<void>): Promise<Error> {
  try {
    await run();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the promise to reject");
}

function LikeCounter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <div role="status" aria-label="likes">
        {count}
      </div>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        좋아요
      </button>
    </div>
  );
}

function TickerOnStart() {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!running) return;

    const intervalId = setInterval(() => {
      setCount((value) => value + 1);
    }, 1_000);

    return () => clearInterval(intervalId);
  }, [running]);

  return (
    <div>
      <div role="status" aria-label="count">
        {count}
      </div>
      <button type="button" aria-label="start" onClick={() => setRunning(true)}>
        start
      </button>
    </div>
  );
}

afterEach(async () => {
  await cleanupReactRoots();
});

describe("imperative siheom", () => {
  it("renders then drives a component imperatively", async () => {
    await given.render(<LikeCounter />);

    await assertions.visible(query.button("좋아요"));
    await actions.click(query.button("좋아요"));

    await assertions.textContent(query.status("likes"), "1");
    await assertions.not.textContent(query.status("likes"), "0");
    await assertions.not.visible(query.button("없는 버튼"));
  });

  it("wraps failures with step logs and an a11y snapshot", async () => {
    await given.render(<LikeCounter />);
    await actions.click(query.button("좋아요"));

    const error = await captureError(() => assertions.disabled(query.button("좋아요")));

    expect(error.message).toContain("[Logs]");
    expect(error.message).toContain('click: button "좋아요"');
    expect(error.message).toContain("[Original Error Message]");
    expect(error.message).toContain("[A11y Snapshot]");
    expect(error.message).toContain("disabled");
  });

  it("runs a fake-timer scope imperatively", async () => {
    await withFakeTimers(async (siheom) => {
      await siheom.given.render(<TickerOnStart />);
      await siheom.actions.click(query.button("start"));
      await siheom.effect.elapsed(1_000);
      await siheom.assertions.textContent(query.status("count"), "1");
    });
  });

  it("cleanupReactRoots unmounts imperatively rendered roots", async () => {
    await given.render(
      <div role="status" aria-label="mounted">
        hi
      </div>,
    );

    expect(document.querySelector('[role="status"]')).not.toBeNull();

    await cleanupReactRoots();

    expect(document.querySelector('[role="status"]')).toBeNull();
    expect(document.body.querySelectorAll(":scope > div")).toHaveLength(0);
  });
});

describe("imperative exports", () => {
  it("exports the full imperative surface", () => {
    expect(typeof given.render).toBe("function");
    expect(typeof actions.click).toBe("function");
    expect(typeof assertions.a11ySnapshot).toBe("function");
    expect(typeof effect.elapsed).toBe("function");
    expect(typeof query.button).toBe("function");
    expect(typeof withFakeTimers).toBe("function");
  });
});
