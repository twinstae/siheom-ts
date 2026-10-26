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

test("release script publishes through the workflow instead of asking for an OTP", () => {
  const script = readText("scripts/release.sh");

  assert.match(script, /gh workflow run publish\.yml --ref main/);
  assert.match(script, /gh run watch/);
  assert.doesNotMatch(script, /otp|OTP|npm publish/);
});
