import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("should publish snapshot before its consumers using Yarn workspace packing", (t) => {
  const { env, callsPath } = stubYarn(t);

  const result = spawnSync(
    process.execPath,
    ["scripts/publish-packages.mjs", "--dry-run", "@siheom/core", "@siheom/snapshot"],
    { cwd: fileURLToPath(new URL("..", import.meta.url)), env, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(callsPath, "utf8").trim().split("\n").map(JSON.parse);
  assert.deepEqual(calls, [
    ["workspace", "@siheom/snapshot", "npm", "publish", "--access", "public", "--dry-run"],
    ["workspace", "@siheom/core", "npm", "publish", "--access", "public", "--dry-run"],
  ]);
});

// Helpers

function stubYarn(t) {
  const directory = mkdtempSync(join(tmpdir(), "siheom-publish-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bin = join(directory, "bin");
  mkdirSync(bin);
  const callsPath = join(directory, "calls.jsonl");
  writeFileSync(
    join(bin, "yarn"),
    `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "npm" && args[1] === "info") process.exit(1);
if (!args.includes("publish") || !args.includes("--dry-run")) {
  throw new Error("Unexpected command: " + JSON.stringify(args));
}
appendFileSync(process.env.SIHEOM_PUBLISH_TEST_LOG, JSON.stringify(args) + "\\n");
`,
    { mode: 0o755 },
  );
  return {
    callsPath,
    env: {
      ...process.env,
      PATH: `${bin}${delimiter}${process.env.PATH}`,
      SIHEOM_PUBLISH_TEST_LOG: callsPath,
    },
  };
}
