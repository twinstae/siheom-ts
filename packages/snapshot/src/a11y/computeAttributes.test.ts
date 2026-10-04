import { describe, expect, it } from "vitest";
import { computeAttributes } from "./computeAttributes.ts";

function make(html: string): Element {
  const container = document.createElement("div");
  container.innerHTML = html.trim();
  const element = container.firstElementChild;
  if (!element) {
    throw new TypeError("Expected test markup to contain an element");
  }

  return element;
}

describe("computeAttributes", () => {
  it("extracts verbose allowlist with normalized keys and lexical ordering", () => {
    const el = make(`
      <button
        RoLe="button"
        ArIa-LaBeL="Save"
        aria-keyshortcuts="Alt+S"
        AccessKey="A"
        TABINDEX="0"
        HIDDEN
        disabled
        readonly=""
        required="required"
        contenteditable="true"
        inert=""
        id="save-btn"
        class="primary"
        style="color: red;"
        data-track="x"
        onclick="console.log('skip')"
      ></button>
    `);

    const attrs = computeAttributes(el);

    if (!attrs) {
      throw new TypeError("Expected computeAttributes to return an attributes object");
    }

    expect(attrs).toEqual({
      accesskey: "A",
      "aria-keyshortcuts": "Alt+S",
      "aria-label": "Save",
      contenteditable: "true",
      disabled: "",
      hidden: "",
      inert: "",
      readonly: "",
      required: "required",
      role: "button",
      tabindex: "0",
    });
    expect(Object.keys(attrs)).toEqual([
      "accesskey",
      "aria-keyshortcuts",
      "aria-label",
      "contenteditable",
      "disabled",
      "hidden",
      "inert",
      "readonly",
      "required",
      "role",
      "tabindex",
    ]);
  });

  it("excludes id, class, style, data-, and event-handler attributes", () => {
    const el = make(
      '<button id="foo" class="bar" style="display:none" data-test="1" onkeyup="alert(1)" onclick="handle()"></button>',
    );

    expect(computeAttributes(el)).toBeUndefined();
  });

  it("keeps boolean attributes as raw empty strings when present", () => {
    const el = make("<button disabled readonly required></button>");

    expect(computeAttributes(el)).toEqual({
      disabled: "",
      readonly: "",
      required: "",
    });
  });

  it("ignores all attributes when no allowlist attribute exists", () => {
    const el = make('<button title="Save" data-test="ok" spellcheck="true"></button>');

    expect(computeAttributes(el)).toBeUndefined();
  });
});
