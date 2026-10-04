import { afterEach, describe, expect, it } from "vitest";
import { getA11ySnapshot, getA11yTree } from "../getA11ySnapshot.ts";
import { buildA11yTree } from "./buildTree.ts";

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

describe("buildA11yTree", () => {
  it("omits an effectively hidden subtree by default", () => {
    const region = render(
      '<section aria-label="Secret" hidden><button>Hidden action</button></section>',
    );

    expect(buildA11yTree(region)).toBeNull();
    expect(getA11ySnapshot(region)).toBe("");
  });

  it("includes a hidden subtree with hidden state on represented descendants", () => {
    const region = render(
      '<section aria-label="Secret" hidden><button>Hidden action</button></section>',
    );

    expect(buildA11yTree(region, { includeHidden: true })).toEqual({
      role: "region",
      name: "",
      states: { hidden: true },
      children: [
        {
          role: "button",
          name: "Hidden action",
          states: { hidden: true },
          children: [],
        },
      ],
    });
  });

  it.each([
    ["its own hidden attribute", "<button hidden>Save</button>", "button"],
    ["a hidden ancestor", "<div hidden><button>Save</button></div>", "button"],
    ["an aria-hidden ancestor", '<div aria-hidden="true"><button>Save</button></div>', "button"],
    [
      "an ancestor with display none",
      '<div style="display:none"><button>Save</button></div>',
      "button",
    ],
    [
      "inherited hidden visibility",
      '<div style="visibility:hidden"><button>Save</button></div>',
      "button",
    ],
  ] as const)("marks a node hidden when hidden by %s", (_label, html, selector) => {
    render(html);
    const element = getElement(selector);

    expect(getA11yTree(element, { includeHidden: true })?.states).toEqual({ hidden: true });
  });

  it("attaches focused shortcut interaction to a compact node", () => {
    const button = render('<button aria-keyshortcuts="Control+S" accesskey="s">Save</button>');
    button.focus();

    expect(getA11yTree(button)).toEqual({
      role: "button",
      name: "Save",
      interaction: {
        focusable: true,
        tabbable: true,
        focused: true,
        keyshortcuts: "Control+S",
        accesskey: "s",
      },
      children: [],
    });
    expect(getA11ySnapshot(button)).toBe(`button: "Save"
  - interaction: [focusable=true] [tabbable=true] [focused=true] [keyshortcuts="Control+S"] [accesskey="s"]
`);
  });

  it("groups aria-busy with live-region metadata", () => {
    const status = render('<div role="status" aria-label="Loading" aria-busy="true"></div>');

    expect(getA11yTree(status)).toEqual({
      role: "status",
      name: "Loading",
      liveRegion: { busy: true },
      children: [],
    });
    expect(getA11ySnapshot(status)).toBe(`status: "Loading"
  - live-region: [busy=true]
`);
  });

  it("builds verbose attributes and serializes final child counts", () => {
    const region = render(
      '<div role="region" aria-label="Panel" tabindex="-1"><button aria-label="Save"></button></div>',
    );

    expect(getA11ySnapshot(region, { mode: "verbose" })).toBe(`region: "Panel" [childCount=1]
  - interaction: [focusable=true] [tabbable=false] [focused=false]
  - attributes: [aria-label="Panel"] [role="region"] [tabindex="-1"]
  button: "Save" [childCount=0]
    - interaction: [focusable=true] [tabbable=true] [focused=false]
    - attributes: [aria-label="Save"]
`);
  });

  it("hoists an inert generic wrapper but preserves interactive generic wrappers", () => {
    const inert = render("<div><button>Save</button></div>");
    expect(getA11yTree(inert)).toEqual({
      role: "",
      name: "",
      children: [
        {
          role: "button",
          name: "Save",
          interaction: { focusable: true, tabbable: true, focused: false },
          children: [],
        },
      ],
    });

    const focusable = render('<div tabindex="0"><button>Save</button></div>');
    expect(getA11yTree(focusable)).toEqual({
      role: "generic",
      name: "",
      interaction: { focusable: true, tabbable: true, focused: false },
      children: [
        {
          role: "button",
          name: "Save",
          interaction: { focusable: true, tabbable: true, focused: false },
          children: [],
        },
      ],
    });

    const shortcut = render('<div aria-keyshortcuts="Control+K"><button>Save</button></div>');
    expect(getA11yTree(shortcut)?.interaction).toEqual({
      focusable: false,
      tabbable: false,
      focused: false,
      keyshortcuts: "Control+K",
    });
  });

  it("keeps computeOther independent and serializes it after verbose attributes", () => {
    const region = render('<div role="region" aria-label="Panel"></div>');

    expect(
      getA11ySnapshot(region, {
        mode: "verbose",
        computeOther: () => ({ engine: "dom" }),
      }),
    ).toBe(`region: "Panel" [childCount=0]
  - interaction: [focusable=false] [tabbable=false] [focused=false]
  - attributes: [aria-label="Panel"] [role="region"]
  - other: [engine="dom"]
`);
  });

  it("keeps iframe and svg descendants excluded when hidden nodes are included", () => {
    const wrapper = render(
      '<div><iframe title="Frame"></iframe><svg aria-label="Graphic"></svg><button>Keep</button></div>',
    );

    expect(getA11ySnapshot(wrapper, { includeHidden: true })).toBe(`button: "Keep"
  - interaction: [focusable=true] [tabbable=true]
`);
  });

  it("passes build options through tree and snapshot serialization overrides", () => {
    const button = render('<button aria-label="Save" hidden></button>');
    const computeOther = () => ({ channel: "tree" });

    expect(getA11yTree(button, { includeHidden: true, mode: "verbose", computeOther })).toEqual({
      role: "button",
      name: "",
      states: { hidden: true },
      interaction: { focusable: false, tabbable: false, focused: false },
      attributes: { "aria-label": "Save", hidden: "" },
      other: { channel: "tree" },
      children: [],
    });
    expect(
      getA11ySnapshot(button, {
        includeHidden: true,
        mode: "compact",
        serialize: { mode: "verbose" },
        computeOther,
      }),
    ).toBe(`button: "" [childCount=0]
  - states: [hidden=true]
  - other: [channel="tree"]
`);
  });
});
