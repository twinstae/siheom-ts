import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readText(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("publish workflow authenticates to npm with OIDC trusted publishing", () => {
  const workflow = readText(".github/workflows/publish.yml");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /group: publish/);
  assert.match(
    workflow,
    /yarn workspaces foreach --all --no-private --topological npm publish --access public --tolerate-republish --provenance/,
  );
  assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN|npmAuthToken|--otp/);
});

test("publish workflow retries transient provenance failures", () => {
  const workflow = readText(".github/workflows/publish.yml");

  assert.match(workflow, /for attempt in 1 2 3; do/);
  assert.match(workflow, /package-manager-cache: false/);
});

test("workflows use actions that run on Node 24", () => {
  for (const name of ["ci.yml", "npm-audit.yml", "publish.yml"]) {
    const workflow = readText(`.github/workflows/${name}`);

    assert.match(workflow, /actions\/checkout@v7/, name);
    assert.match(workflow, /actions\/setup-node@v7/, name);
    assert.doesNotMatch(workflow, /actions\/(checkout|setup-node)@v[4-6]\b/, name);
  }
});

test("release script publishes through the workflow instead of asking for an OTP", () => {
  const script = readText("scripts/release.sh");

  assert.match(script, /gh workflow run publish\.yml --ref main/);
  assert.match(script, /gh run watch/);
  assert.doesNotMatch(script, /otp|OTP|npm publish/);
});
