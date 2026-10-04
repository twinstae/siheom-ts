import { describe, expect, it } from "vitest";
import { tableToMarkdown } from "./tableToMarkdown.ts";
import { tableFixtures, type TableFixtureName } from "./a11y/tableFixtures.ts";

describe("tableToMarkdown", () => {
  it.each(Object.keys(tableFixtures) as TableFixtureName[])("fixture: %s", async (name) => {
    document.body.innerHTML = tableFixtures[name];
    const table = document.querySelector("table, [role='table']") as HTMLTableElement;

    await expect(tableToMarkdown(table)).toMatchFileSnapshot(`__snapshots__/table-${name}.snap`);
  });

  it("throws when the table has no rows", () => {
    document.body.innerHTML = `<table></table>`;

    expect(() => tableToMarkdown(document.querySelector("table")!)).toThrow(
      "there is no rows in table!",
    );
  });
});
