import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import {
  createDefaultActions,
  createDefaultAssertions,
  defaultEffects,
  type Locator,
} from "./index.ts";
import { createImperativeSiheom, actions, assertions, effect, query, withFakeTimers } from "./imperative.ts";

async function captureError(run: () => Promise<void>): Promise<Error> {
  try {
    await run();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the promise to reject");
}

describe("imperative defaults", () => {
  it("runs actions against the real DOM", async () => {
    let clicked = false;
    document.body.innerHTML = `<label>이름<input /></label><button type="button">저장</button>`;
    document.querySelector("button")!.addEventListener("click", () => {
      clicked = true;
    });

    await actions.fill(query.textbox("이름"), "김태희");
    await actions.click(query.button("저장"));

    expect(document.querySelector("input")).toHaveValue("김태희");
    expect(clicked).toBe(true);
  });

  it("asserts visible / not.visible with implicit expected values", async () => {
    document.body.innerHTML = `<button type="button">저장</button>`;

    await assertions.visible(query.button("저장"));
    await assertions.not.visible(query.button("취소"));
  });

  it("asserts flag-style expectations with implicit true and .not", async () => {
    document.body.innerHTML = `
      <label>이름<input value="김" /></label>
      <div role="status" aria-label="count">3</div>
    `;

    await assertions.value(query.textbox("이름"), "김");
    await assertions.not.value(query.textbox("이름"), "이");
    await assertions.textContent(query.status("count"), "3");
    await assertions.not.textContent(query.status("count"), "4");
  });
});

describe("createImperativeSiheom", () => {
  function createSiheom() {
    return createImperativeSiheom({
      actions: createDefaultActions(),
      assertions: createDefaultAssertions(),
      givens: {},
      effects: defaultEffects,
    });
  }

  it("wraps failures with step logs and an a11y snapshot", async () => {
    document.body.innerHTML = `<button type="button">저장</button>`;
    const siheom = createSiheom();

    await siheom.actions.click(query.button("저장"));

    const error = await captureError(() => siheom.assertions.disabled(query.button("저장")));

    expect(error.message).toContain("[Logs]");
    expect(error.message).toContain('click: button "저장"');
    expect(error.message).toContain("[Original Error Message]");
    expect(error.message).toContain("[A11y Snapshot]");
    expect(error.message).toContain("disabled");
  });

  it("clearLogs discards accumulated step logs", async () => {
    document.body.innerHTML = `<button type="button">저장</button>`;
    const siheom = createSiheom();

    await siheom.actions.click(query.button("저장"));
    siheom.clearLogs();

    const error = await captureError(() => siheom.assertions.disabled(query.button("저장")));

    expect(error.message).not.toContain("click:");
  });

  it("runs custom registries through imperative bindings", async () => {
    document.body.innerHTML = `<button type="button">Go</button>`;
    const siheom = createImperativeSiheom({
      actions: {
        tap: async (target: Locator) => {
          expect(target.role).toBe("button");
          document.querySelector("button")!.dataset.tapped = "true";
        },
      },
      assertions: {},
      givens: {},
      effects: {},
    });

    await siheom.actions.tap(query.button("Go"));

    expect(document.querySelector("button")).toHaveAttribute("data-tapped", "true");
  });

  it("runs effect.elapsed inside an imperative fake-timer scope", async () => {
    document.body.innerHTML = `<div role="status" aria-label="count">0</div>`;
    const status = document.querySelector("[role=status]")!;
    const siheom = createImperativeSiheom({
      actions: {},
      assertions: createDefaultAssertions(),
      givens: {
        start: async () => {
          setTimeout(() => {
            status.textContent = "1";
          }, 1000);
        },
      },
      effects: defaultEffects,
    });

    await siheom.withFakeTimers(async (scoped) => {
      await scoped.given.start();
      await scoped.effect.elapsed(1000);
      await scoped.assertions.textContent(query.status("count"), "1");
    });
  });
});

describe("imperative effect defaults", () => {
  it("exports an imperative effect binder", () => {
    expect(typeof effect.elapsed).toBe("function");
    expect(typeof withFakeTimers).toBe("function");
  });
});