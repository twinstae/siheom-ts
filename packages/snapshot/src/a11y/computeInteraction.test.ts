import { afterEach, describe, expect, it } from "vitest";
import { computeInteraction } from "./computeInteraction.ts";

const ACTIVE = { focusable: true, tabbable: true, focused: false } as const;
const INACTIVE = { focusable: false, tabbable: false, focused: false } as const;

function render(html: string): HTMLElement {
  document.body.innerHTML = html.trim();
  const element = document.body.firstElementChild;
  if (!(element instanceof HTMLElement)) {
    throw new TypeError("Expected test markup to contain an HTML element");
  }
  return element;
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new TypeError(`Expected test markup to contain ${selector}`);
  }
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("computeInteraction", () => {
  it("reports a visible button as focusable and tabbable", () => {
    const button = render("<button>Save</button>");

    const interaction = computeInteraction(button);

    expect(interaction).toEqual(ACTIVE);
  });

  it("reports focus without changing the active element", () => {
    const button = render("<button>Save</button>");
    button.focus();
    const activeElement = document.activeElement;

    const interaction = computeInteraction(button);

    expect(interaction).toEqual({ focusable: true, tabbable: true, focused: true });
    expect(document.activeElement).toBe(activeElement);
  });

  it("resolves focus to the deepest active shadow element", () => {
    const host = render('<div tabindex="0"></div>');
    const shadowRoot = host.attachShadow({ mode: "open" });
    const button = document.createElement("button");
    shadowRoot.append(button);
    button.focus();

    const hostInteraction = computeInteraction(host);
    const buttonInteraction = computeInteraction(button);

    expect(hostInteraction?.focused).toBe(false);
    expect(buttonInteraction?.focused).toBe(true);
  });

  it("distinguishes anchors by href", () => {
    const anchor = render('<a href="/next">Next</a>');
    expect(computeInteraction(anchor)).toEqual(ACTIVE);

    const inertAnchor = render("<a>Next</a>");
    expect(computeInteraction(inertAnchor)).toBeUndefined();
    expect(computeInteraction(inertAnchor, true)).toEqual(INACTIVE);
  });

  it.each([
    ["input", "<input>", ACTIVE],
    ["select", "<select></select>", ACTIVE],
    ["textarea", "<textarea></textarea>", ACTIVE],
    ["disabled input", "<input disabled>", undefined],
    ["disabled select", "<select disabled></select>", undefined],
    ["disabled textarea", "<textarea disabled></textarea>", undefined],
    ["hidden input", "<input hidden>", undefined],
    ["hidden select", "<select hidden></select>", undefined],
    ["hidden textarea", "<textarea hidden></textarea>", undefined],
  ] as const)("handles %s native control semantics", (_label, html, expected) => {
    const element = render(html);

    const interaction = computeInteraction(element);

    expect(interaction).toEqual(expected);
  });

  it.each([
    ['<div tabindex="-1"></div>', { focusable: true, tabbable: false, focused: false }],
    ['<div tabindex="0"></div>', ACTIVE],
    ['<div tabindex="3"></div>', ACTIVE],
  ] as const)("uses effective tabindex for %s", (html, expected) => {
    const element = render(html);

    const interaction = computeInteraction(element);

    expect(interaction).toEqual(expected);
  });

  it("supports contenteditable except the explicit false value", () => {
    const editable = render('<div contenteditable="true"></div>');
    expect(computeInteraction(editable)).toEqual(ACTIVE);

    const inert = render('<div contenteditable="false"></div>');
    expect(computeInteraction(inert)).toBeUndefined();
  });

  it("supports area links and summary elements", () => {
    render('<map><area id="area" href="#target"></map>');
    expect(computeInteraction(getElement("#area"))).toEqual(ACTIVE);

    const summary = render("<summary>Details</summary>");
    expect(computeInteraction(summary)).toEqual(ACTIVE);
  });

  it.each([
    ["hidden attribute", "<button hidden>Save</button>"],
    ["display none", '<button style="display:none">Save</button>'],
    ["hidden visibility", '<button style="visibility:hidden">Save</button>'],
  ] as const)("suppresses interaction for %s", (_label, html) => {
    const button = render(html);

    const interaction = computeInteraction(button, true);

    expect(interaction).toEqual(INACTIVE);
  });

  it("suppresses a control disabled by its fieldset", () => {
    render("<fieldset disabled><button>Save</button></fieldset>");
    const button = getElement("button");

    const interaction = computeInteraction(button, true);

    expect(interaction).toEqual(INACTIVE);
  });

  it("keeps an aria-disabled button focusable and tabbable", () => {
    const button = render('<button aria-disabled="true">Save</button>');

    const interaction = computeInteraction(button);

    expect(interaction).toEqual(ACTIVE);
  });

  it("prunes only unchecked radios with a checked candidate in the same form", () => {
    render(`
      <form>
        <input id="checked" type="radio" name="choice" checked>
        <input id="unchecked" type="radio" name="choice">
      </form>
      <form><input id="other-form" type="radio" name="choice"></form>
    `);

    expect(computeInteraction(getElement("#checked"))).toEqual(ACTIVE);
    expect(computeInteraction(getElement("#unchecked"))).toEqual({
      focusable: true,
      tabbable: false,
      focused: false,
    });
    expect(computeInteraction(getElement("#other-form"))).toEqual(ACTIVE);
  });

  it("keeps unchecked radios tabbable when their group has no checked candidate", () => {
    render(`
      <form>
        <input id="first" type="radio" name="choice">
        <input id="second" type="radio" name="choice">
      </form>
    `);

    expect(computeInteraction(getElement("#first"))).toEqual(ACTIVE);
    expect(computeInteraction(getElement("#second"))).toEqual(ACTIVE);
  });

  it("trims non-empty shortcut declarations and omits empty declarations", () => {
    const declared = render('<div aria-keyshortcuts="  Control+S  " accesskey="  s  "></div>');
    expect(computeInteraction(declared)).toEqual({
      focusable: false,
      tabbable: false,
      focused: false,
      keyshortcuts: "Control+S",
      accesskey: "s",
    });

    const empty = render('<div aria-keyshortcuts="  " accesskey=" "></div>');
    expect(computeInteraction(empty)).toBeUndefined();
  });

  it("returns false booleans for an inert div in verbose mode", () => {
    const inert = render("<div></div>");

    const interaction = computeInteraction(inert, true);

    expect(interaction).toEqual(INACTIVE);
  });

  it("is deterministic and does not mutate focus across repeated calls", () => {
    const button = render("<button>Save</button>");
    button.focus();
    const activeElement = document.activeElement;

    const first = computeInteraction(button);
    const second = computeInteraction(button);

    expect(second).toEqual(first);
    expect(document.activeElement).toBe(activeElement);
  });
});
