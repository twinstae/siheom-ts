import { describe, expect, it } from "vitest";
import { getA11ySnapshot, getA11yTree } from "./getA11ySnapshot.ts";
import { a11yFixtures, type A11yFixtureName } from "./a11y/a11yFixtures.ts";
import markdownSampleHtml from "./markdown-sample.html?raw";

describe("getA11ySnapshot", () => {
  it("records markdown-sample.html accessible tree", async () => {
    document.body.innerHTML = markdownSampleHtml;

    await expect(getA11ySnapshot(document.body)).toMatchFileSnapshot(
      "__snapshots__/a11y-markdown-sample.snap",
    );
  });

  it.each(Object.keys(a11yFixtures) as A11yFixtureName[])("fixture: %s", async (name) => {
    document.body.innerHTML = a11yFixtures[name];

    await expect(getA11ySnapshot(document.body)).toMatchFileSnapshot(
      `__snapshots__/a11y-${name}.snap`,
    );
  });

  it("escapes quotes and newlines in accessible names", async () => {
    document.body.innerHTML = `<button type="button" aria-label='Say "hi"\nnow'>x</button>`;

    await expect(getA11ySnapshot(document.body)).toMatchFileSnapshot(
      "__snapshots__/a11y-escaped-name.snap",
    );
  });

  it("returns empty string when the tree is inaccessible", () => {
    document.body.innerHTML = `<div aria-hidden="true"><button>숨김</button></div>`;
    const root = document.querySelector("div");

    expect(root).not.toBeNull();
    if (root) expect(getA11ySnapshot(root)).toBe("");
  });

  it("ends non-empty snapshots with a newline", () => {
    // Given
    document.body.innerHTML = `<button type="button">저장</button>`;

    // When
    const snapshot = getA11ySnapshot(document.body);

    // Then
    expect(snapshot.endsWith("\n")).toBe(true);
  });

  it("verbose mode keeps nullish relation targets and generic wrappers", async () => {
    document.body.innerHTML = `
      <div aria-controls="missing-id">
        <button type="button">열기</button>
      </div>
    `;

    await expect(getA11ySnapshot(document.body, { mode: "verbose" })).toMatchFileSnapshot(
      "__snapshots__/a11y-verbose-missing-controls.snap",
    );
  });

  it("includes computeOther fields on matching elements", async () => {
    document.body.innerHTML = `<button type="button" data-testid="save">저장</button>`;

    await expect(
      getA11ySnapshot(document.body, {
        computeOther: (el) =>
          el instanceof HTMLElement && el.dataset.testid
            ? { testid: el.dataset.testid }
            : undefined,
      }),
    ).toMatchFileSnapshot("__snapshots__/a11y-compute-other.snap");
  });

  it("returns a structured tree via getA11yTree", () => {
    document.body.innerHTML = `<button type="button">저장</button>`;

    const tree = getA11yTree(document.body);

    expect(tree?.children.some((child) => child.role === "button" && child.name === "저장")).toBe(
      true,
    );
  });
});
