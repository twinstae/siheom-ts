import { describe, expect, it } from "vitest";
import { serializeA11yTree } from "./serializeTree.ts";
import type { A11yNode } from "./types.ts";

describe("serializeA11yTree", () => {
  it("keeps explicit false ARIA states while omitting false compact interaction", () => {
    const node: A11yNode = {
      role: "button",
      name: "Menu",
      states: { expanded: false },
      interaction: { focusable: false, tabbable: false, focused: false },
      children: [],
    };

    expect(serializeA11yTree(node)).toBe(`button: "Menu"
  - states: [expanded=false]
`);
  });

  it("serializes compact interaction fields in fixed order", () => {
    const node: A11yNode = {
      role: "button",
      name: "Save",
      interaction: {
        focusable: true,
        tabbable: true,
        focused: false,
        keyshortcuts: "Alt+S",
        accesskey: "s",
      },
      children: [],
    };

    expect(serializeA11yTree(node)).toBe(`button: "Save"
  - interaction: [focusable=true] [tabbable=true] [keyshortcuts="Alt+S"] [accesskey="s"]
`);
  });

  it("serializes verbose leaf interaction, child count, and sorted attributes", () => {
    const node: A11yNode = {
      role: "button",
      name: "Save",
      interaction: { focusable: false, tabbable: false, focused: false },
      attributes: { role: "button", disabled: "", "aria-label": "Save" },
      children: [],
    };

    expect(serializeA11yTree(node, { mode: "verbose" })).toBe(`button: "Save" [childCount=0]
  - interaction: [focusable=false] [tabbable=false] [focused=false]
  - attributes: [aria-label="Save"] [disabled=""] [role="button"]
`);
  });

  it("serializes every group in the specified order", () => {
    const node: A11yNode = {
      role: "button",
      name: "Save",
      states: { disabled: true },
      interaction: { focusable: true, tabbable: true, focused: false },
      properties: { valuenow: 3, haspopup: "menu", autocomplete: "list" },
      relations: { controls: [{ id: "panel", name: "Panel" }] },
      liveRegion: { live: "polite", atomic: true, relevant: "text", busy: true },
      dragDrop: { grabbed: false, dropeffect: "copy" },
      attributes: { role: "button" },
      other: { engine: "dom" },
      children: [],
    };

    expect(serializeA11yTree(node, { mode: "verbose" })).toBe(`button: "Save" [childCount=0]
  - states: [disabled=true]
  - interaction: [focusable=true] [tabbable=true] [focused=false]
  - properties: [autocomplete="list"] [haspopup="menu"] [valuenow=3]
  - relations:
    controls: "Panel" (#panel)
  - live-region: [live="polite"] [atomic=true] [relevant="text"] [busy=true]
  - drag-and-drop: [dropeffect="copy"] (deprecated) [grabbed=false] (deprecated)
  - attributes: [role="button"]
  - other: [engine="dom"]
`);
  });

  it("preserves legacy focus fields in states", () => {
    const node: A11yNode = {
      role: "button",
      name: "Legacy",
      states: { focusable: false, focused: true },
      children: [],
    };

    expect(serializeA11yTree(node)).toBe(`button: "Legacy"
  - states: [focusable=false] [focused=true]
`);
  });

  it("keeps semantic groups visible on roleless leaf nodes", () => {
    const node: A11yNode = {
      role: "",
      name: "text",
      interaction: { focusable: false, tabbable: false, focused: false },
      attributes: { role: "presentation" },
      children: [],
    };

    expect(serializeA11yTree(node, { mode: "verbose" })).toBe(`generic: "text" [childCount=0]
  - interaction: [focusable=false] [tabbable=false] [focused=false]
  - attributes: [role="presentation"]
`);
  });

  it("keeps an empty name explicit on compact non-text nodes", () => {
    const node: A11yNode = { role: "button", name: "", children: [] };

    expect(serializeA11yTree(node)).toBe(`button: ""
`);
  });

  it("omits an empty name on compact non-leaf nodes", () => {
    const node: A11yNode = {
      role: "group",
      name: "",
      children: [{ role: "", name: "Child", children: [] }],
    };

    expect(serializeA11yTree(node)).toBe(`group:
  "Child"
`);
  });

  it("escapes shortcut and attribute string declarations", () => {
    const node: A11yNode = {
      role: "button",
      name: "Escape",
      interaction: {
        focusable: false,
        tabbable: false,
        focused: false,
        keyshortcuts: 'Ctrl+"\\\nEnter',
        accesskey: '"',
      },
      attributes: { "aria-label": 'say "hi"\\\nnow' },
      children: [],
    };

    expect(serializeA11yTree(node, { mode: "verbose" }))
      .toBe(String.raw`button: "Escape" [childCount=0]
  - interaction: [focusable=false] [tabbable=false] [focused=false] [keyshortcuts="Ctrl+\"\\\nEnter"] [accesskey="\""]
  - attributes: [aria-label="say \"hi\"\\\nnow"]
`);
  });

  it("omits attributes and child counts from compact output", () => {
    const node: A11yNode = {
      role: "button",
      name: "Parent",
      attributes: { role: "button" },
      children: [{ role: "", name: "Child", children: [] }],
    };

    expect(serializeA11yTree(node)).toBe(`button: "Parent"
  "Child"
`);
  });
});
