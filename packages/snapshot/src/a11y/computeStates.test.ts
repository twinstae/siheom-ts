import { describe, expect, it } from "vitest";
import { computeStates } from "./computeStates.ts";

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

describe("computeAriaSelected", () => {
  it("returns true for <option selected>", () => {
    const el = query(make("<select><option selected>x</option></select>"), "option");
    expect(computeStates(el, "option")?.selected).toBe(true);
  });
});

describe("computeAriaCurrent", () => {
  it('returns "page" for aria-current="page"', () => {
    const el = make('<a aria-current="page">Home</a>');
    expect(computeStates(el, "link")?.current).toBe("page");
  });
});

describe("computeAriaChecked", () => {
  it("returns true for <input type=checkbox checked>", () => {
    const el = make('<input type="checkbox" checked />');
    expect(computeStates(el, "checkbox")?.checked).toBe(true);
  });

  it("returns false for <input type=checkbox> (compact: emitted)", () => {
    const el = make('<input type="checkbox" />');
    expect(computeStates(el, "checkbox")?.checked).toBe(false);
  });
});

describe("computeAriaPressed", () => {
  it('returns true for aria-pressed="true"', () => {
    const el = make('<button aria-pressed="true">Go</button>');
    expect(computeStates(el, "button")?.pressed).toBe(true);
  });
});

describe("computeAriaExpanded", () => {
  it('returns false for aria-expanded="false" (compact: MUST be emitted)', () => {
    const el = make('<button aria-expanded="false">Menu</button>');
    expect(computeStates(el, "button")?.expanded).toBe(false);
  });
});

describe("computeAriaHidden", () => {
  it('returns true for aria-hidden="true"', () => {
    const el = make('<div aria-hidden="true"></div>');
    expect(computeStates(el, "generic")?.hidden).toBe(true);
  });
});

describe("computeAriaModal", () => {
  it('returns true for aria-modal="true"', () => {
    const el = make('<div role="dialog" aria-modal="true"></div>');
    expect(computeStates(el, "dialog")?.modal).toBe(true);
  });
});

describe("computeAriaInvalid", () => {
  it('returns "grammar" for aria-invalid="grammar"', () => {
    const el = make('<input aria-invalid="grammar" />');
    expect(computeStates(el, "textbox")?.invalid).toBe("grammar");
  });
});

describe("computeAriaRequired", () => {
  it("returns true for <input required>", () => {
    const el = make("<input required />");
    expect(computeStates(el, "textbox")?.required).toBe(true);
  });
});

describe("computeAriaDisabled", () => {
  it("returns true for <button disabled>", () => {
    const el = make("<button disabled>Go</button>");
    expect(computeStates(el, "button")?.disabled).toBe(true);
  });

  it("returns true for <input> inside <fieldset disabled> (inherited)", () => {
    const el = query(make("<fieldset disabled><input /></fieldset>"), "input");
    expect(computeStates(el, "textbox")?.disabled).toBe(true);
  });

  it('returns false for aria-disabled="false"', () => {
    const el = make('<button aria-disabled="false">Go</button>');
    expect(computeStates(el, "button")?.disabled).toBe(false);
  });
});

describe("computeAriaReadonly", () => {
  it("returns true for <input readonly>", () => {
    const el = make("<input readonly />");
    expect(computeStates(el, "textbox")?.readonly).toBe(true);
  });
});
