import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type { A11ySnapshotOptions } from "@siheom/snapshot";
import type { Locator } from "./types.ts";
import { query } from "./query.ts";

vi.stubGlobal("expect", expect);
const { assertions, defaultAssertions } = await import("./assert.ts");

const target: Locator = { role: "region", name: "Panel" };
const options = { mode: "verbose", includeHidden: true } satisfies A11ySnapshotOptions;

function renderPanel(): void {
  document.body.innerHTML = `
    <div role="region" aria-label="Panel">
      <button>Visible action</button>
      <button aria-label="Hidden action" hidden>Hidden action</button>
    </div>
  `;
}

afterEach(() => {
  document.body.replaceChildren();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("assertions.focused", () => {
  it("passes when the target element has focus", async () => {
    document.body.innerHTML = `<button>Go</button>`;
    document.querySelector("button")!.focus();

    await defaultAssertions.focused(query.button("Go"), true);
  });

  it("passes when the target element does not have focus", async () => {
    document.body.innerHTML = `<button>Go</button><input aria-label="Name" />`;
    document.querySelector("input")!.focus();

    await defaultAssertions.focused(query.button("Go"), false);
  });
});

describe("assertions.textContent", () => {
  it("passes when the target element has the expected text", async () => {
    document.body.innerHTML = `<p role="status" aria-label="남은 할 일">2 items left</p>`;

    await defaultAssertions.textContent(query.status("남은 할 일"), "2 items left", true);
  });

  it("passes when the target element does not have the expected text", async () => {
    document.body.innerHTML = `<p role="status" aria-label="남은 할 일">1 item left</p>`;

    await defaultAssertions.textContent(query.status("남은 할 일"), "2 items left", false);
  });
});

describe("assertions.checked", () => {
  it("passes for a controlled checkbox whose checked state is a property", async () => {
    document.body.innerHTML = `<input type="checkbox" aria-label="Done" />`;
    (document.querySelector("input") as HTMLInputElement).checked = true;

    await defaultAssertions.checked(query.checkbox("Done"), true);
  });

  it("passes for a checkbox with aria-checked", async () => {
    document.body.innerHTML = `<span role="checkbox" aria-checked="true" aria-label="Done" />`;

    await defaultAssertions.checked(query.checkbox("Done"), true);
  });

  it("passes when the checkbox is not checked", async () => {
    document.body.innerHTML = `<input type="checkbox" aria-label="Done" />`;

    await defaultAssertions.checked(query.checkbox("Done"), false);
  });
});

describe("assertions.a11ySnapshot", () => {
  it("keeps the path as the only runtime argument when options are omitted", () => {
    const step = assertions.a11ySnapshot(target, "default.snap");

    expect(step.args).toEqual(["default.snap"]);
  });

  it("includes snapshot options in the runtime arguments when provided", () => {
    const step = assertions.a11ySnapshot(target, "verbose.snap", options);

    expect(step.args).toEqual(["verbose.snap", options]);
  });
});

describe("defaultAssertions.a11ySnapshot", () => {
  it("omits hidden descendants when options are omitted", async () => {
    renderPanel();

    await defaultAssertions.a11ySnapshot(target, "assert-default.snap");
  });

  it("forwards verbose hidden options to the accessibility snapshot", async () => {
    renderPanel();

    await defaultAssertions.a11ySnapshot(target, "assert-verbose-hidden.snap", options);
  });
});
