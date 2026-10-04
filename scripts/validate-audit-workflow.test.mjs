import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readJson(path) {
  return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
}

function readText(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("pull request CI excludes registry-dependent audits", () => {
  const rootPackage = readJson("package.json");

  assert.doesNotMatch(rootPackage.scripts.ci, /yarn npm audit/);
});

test("weekly audit keeps at most one open finding issue", () => {
  const workflow = readText(".github/workflows/npm-audit.yml");

  assert.match(workflow, /cron: "0 0 \* \* 1"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /group: npm-audit/);
  assert.match(workflow, /yarn npm audit --all --recursive --no-deprecations/);

  const lookupIndex = workflow.indexOf("gh issue list");
  const createIndex = workflow.indexOf("gh issue create");
  assert.ok(lookupIndex >= 0 && lookupIndex < createIndex);
  assert.match(
    workflow,
    /if \[\[ -n "\$issue_number" \]\]; then[\s\S]*gh issue edit[\s\S]*else[\s\S]*gh issue create/,
  );
  assert.match(workflow, /gh issue close/);
});
