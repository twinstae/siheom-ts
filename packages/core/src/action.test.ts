import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { createDefaultActions } from "./action.ts";
import { query } from "./query.ts";
import { userEvent as browserUserEvent } from "vitest/browser";

const actions = createDefaultActions();

describe("defaultActions", () => {
  it("fills a textbox by clearing then typing", async () => {
    document.body.innerHTML = `<label>이름<input value="old" /></label>`;

    await actions.fill(query.textbox("이름"), "김태희");

    expect(document.querySelector("input")).toHaveValue("김태희");
  });

  it("types into a textbox appending characters", async () => {
    document.body.innerHTML = `<label>이름<input value="김" /></label>`;
    const input = document.querySelector("input") as HTMLInputElement;
    input.focus();
    input.setSelectionRange(1, 1);

    await actions.type(query.textbox("이름"), "태");

    expect(input).toHaveValue("김태");
  });

  it("double-clicks a button", async () => {
    let clicks = 0;
    document.body.innerHTML = `<button type="button">열기</button>`;
    document.querySelector("button")!.addEventListener("dblclick", () => {
      clicks += 1;
    });

    await actions.dblclick(query.button("열기"));

    expect(clicks).toBe(1);
  });

  it("hovers a target so mouseenter handlers run", async () => {
    let hovered = false;
    document.body.innerHTML = `<button type="button">메뉴</button>`;
    document.querySelector("button")!.addEventListener("mouseenter", () => {
      hovered = true;
    });

    await actions.hover(query.button("메뉴"));

    expect(hovered).toBe(true);
  });

  it("tabs from the currently focused control to the next", async () => {
    document.body.innerHTML = `
      <button type="button">첫번째</button>
      <button type="button">두번째</button>
    `;
    const [first, second] = Array.from(document.querySelectorAll("button"));
    first!.focus();

    await actions.tab(query.button("첫번째"));

    expect(second).toHaveFocus();
  });

  it("uploads a File into a labeled file input", async () => {
    document.body.innerHTML = `<label>첨부<input type="file" /></label>`;
    const file = new File(["hello"], "note.txt", { type: "text/plain" });

    await actions.upload(query.label("첨부"), file);

    const input = document.querySelector("input") as HTMLInputElement;
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]?.name).toBe("note.txt");
  });

  it("drags a list item onto another list item", async () => {
    document.body.innerHTML = `
      <ul aria-label="할 일">
        <li aria-label="디자인" draggable="true" id="design">디자인</li>
        <li aria-label="완료" id="done">완료</li>
      </ul>
    `;
    const done = document.getElementById("done")!;
    done.addEventListener("drop", (event) => {
      event.preventDefault();
      done.textContent = "디자인";
    });
    document.querySelector('[aria-label="디자인"]')!.addEventListener("dragstart", (event) => {
      (event as DragEvent).dataTransfer?.setData("text/plain", "design");
    });
    document.getElementById("done")!.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    await actions.dragAndDrop(query.listitem("디자인"), query.listitem("완료"));

    expect(done).toHaveTextContent("디자인");
  });
});

describe("createDefaultActions with an injected user", () => {
  it("accepts vitest/browser userEvent so clicks are trusted (real) input", async () => {
    document.body.innerHTML = `<button type="button">바깥 버튼</button>`;
    let isTrusted: boolean | undefined;
    document.addEventListener(
      "pointerdown",
      (event) => {
        isTrusted = event.isTrusted;
      },
      { once: true },
    );

    await createDefaultActions({ user: browserUserEvent }).click(query.button("바깥 버튼"));

    expect(isTrusted).toBe(true);
  });
});
