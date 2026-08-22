import { describe, expect, it } from "vitest";
import { getA11ySnapshot, getA11yTree, tableToMarkdown } from "./index.ts";

describe("@siheom/snapshot", () => {
  it("exports accessibility and table snapshot utilities", () => {
    expect(getA11ySnapshot).toBeTypeOf("function");
    expect(getA11yTree).toBeTypeOf("function");
    expect(tableToMarkdown).toBeTypeOf("function");
  });
});
