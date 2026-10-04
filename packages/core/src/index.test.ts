import { describe, expect, it } from "vitest";
import * as core from "./index.ts";

describe("@siheom/core", () => {
  it("should keep snapshot utilities available through the core entry point", () => {
    expect(core.getA11ySnapshot).toBeTypeOf("function");
    expect(core.tableToMarkdown).toBeTypeOf("function");
  });
});
