import { describe, expect, it } from "vitest";
import { isDisabledByHTMLSemantics, isEffectivelyHidden } from "./elementSemantics.ts";

function make(html: string): Element {
  const container = document.createElement("div");
  container.innerHTML = html.trim();
  const element = container.firstElementChild;
  if (!element) throw new TypeError("Expected test markup to contain an element");
  return element;
}

function query(root: Element, selector: string): Element {
  const element = root.querySelector(selector);
  if (!element) throw new TypeError(`Expected test markup to contain ${selector}`);
  return element;
}

describe("isEffectivelyHidden", () => {
  it("returns true for element with hidden attribute", () => {
    const el = make("<div hidden></div>");
    expect(isEffectivelyHidden(el)).toBe(true);
  });

  it("returns true for element inside parent with hidden attribute", () => {
    const el = query(make("<div hidden><span>x</span></div>"), "span");
    expect(isEffectivelyHidden(el)).toBe(true);
  });

  it("returns true for element with aria-hidden=true", () => {
    const el = make('<div aria-hidden="true"></div>');
    expect(isEffectivelyHidden(el)).toBe(true);
  });

  it("returns true for element inside parent with aria-hidden=true", () => {
    const el = query(make('<div aria-hidden="true"><span>x</span></div>'), "span");
    expect(isEffectivelyHidden(el)).toBe(true);
  });

  it("returns true for element with display:none computed style", () => {
    const el = make("<div style='display:none'></div>");
    expect(isEffectivelyHidden(el)).toBe(true);
  });

  it("returns true for element with visibility:hidden computed style", () => {
    const el = make("<div style='visibility:hidden'></div>");
    expect(isEffectivelyHidden(el)).toBe(true);
  });

  it("returns true for element inside parent with visibility:hidden (inherited)", () => {
    const el = query(make("<div style='visibility:hidden'><span>x</span></div>"), "span");
    expect(isEffectivelyHidden(el)).toBe(true);
  });

  it("returns false for visible element with no hiding", () => {
    const el = query(make("<div><span>x</span></div>"), "span");
    expect(isEffectivelyHidden(el)).toBe(false);
  });

  it("returns false for element with aria-hidden=false", () => {
    const el = make('<div aria-hidden="false"></div>');
    expect(isEffectivelyHidden(el)).toBe(false);
  });
});

describe("isDisabledByHTMLSemantics", () => {
  it("returns true for <button disabled>", () => {
    const el = make("<button disabled>Go</button>");
    expect(isDisabledByHTMLSemantics(el)).toBe(true);
  });

  it("returns true for <input disabled>", () => {
    const el = make("<input disabled />");
    expect(isDisabledByHTMLSemantics(el)).toBe(true);
  });

  it("returns true for button inside <fieldset disabled>", () => {
    const el = query(make("<fieldset disabled><button>Go</button></fieldset>"), "button");
    expect(isDisabledByHTMLSemantics(el)).toBe(true);
  });

  it("returns false for button inside first legend of <fieldset disabled> (first legend exception)", () => {
    const el = query(
      make("<fieldset disabled><legend><button>Go</button></legend></fieldset>"),
      "button",
    );
    expect(isDisabledByHTMLSemantics(el)).toBe(false);
  });

  it("returns true for button inside second legend of <fieldset disabled>", () => {
    const el = query(
      make(
        "<fieldset disabled><legend>First</legend><legend><button>Go</button></legend></fieldset>",
      ),
      "button",
    );
    expect(isDisabledByHTMLSemantics(el)).toBe(true);
  });

  it("returns true for <option disabled>", () => {
    const el = query(make("<select><option disabled>x</option></select>"), "option");
    expect(isDisabledByHTMLSemantics(el)).toBe(true);
  });

  it("returns true for <optgroup disabled>", () => {
    const el = query(
      make("<select><optgroup disabled><option>x</option></optgroup></select>"),
      "optgroup",
    );
    expect(isDisabledByHTMLSemantics(el)).toBe(true);
  });

  it("returns false for <button aria-disabled=true> (aria-disabled is NOT native disabled)", () => {
    const el = make('<button aria-disabled="true">Go</button>');
    expect(isDisabledByHTMLSemantics(el)).toBe(false);
  });

  it("returns false for <button> with no disabled", () => {
    const el = make("<button>Go</button>");
    expect(isDisabledByHTMLSemantics(el)).toBe(false);
  });

  it("returns true for form-associated custom element inside disabled fieldset", () => {
    customElements.define(
      "test-form-control-disabled",
      class extends HTMLElement {
        static formAssociated = true;
      },
    );
    const el = query(
      make(
        "<fieldset disabled><test-form-control-disabled></test-form-control-disabled></fieldset>",
      ),
      "test-form-control-disabled",
    );
    expect(isDisabledByHTMLSemantics(el)).toBe(true);
  });

  it("returns false for form-associated custom element NOT inside disabled fieldset", () => {
    customElements.define(
      "test-form-control-enabled",
      class extends HTMLElement {
        static formAssociated = true;
      },
    );
    const el = query(
      make("<div><test-form-control-enabled></test-form-control-enabled></div>"),
      "test-form-control-enabled",
    );
    expect(isDisabledByHTMLSemantics(el)).toBe(false);
  });
});
