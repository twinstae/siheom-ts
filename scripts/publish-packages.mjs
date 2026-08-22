#!/usr/bin/env node
/**
 * Publish through Yarn's workspace packer so workspace ranges, package files,
 * and publish configuration match the artifacts checked by CI.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(ROOT, "packages");

const PUBLISH_ORDER = [
  "@siheom/snapshot",
  "@siheom/core",
  "@siheom/react",
  "@siheom/vue",
  "@siheom/svelte",
  "@siheom/solid",
  "@siheom/angular",
  "@siheom/qwik",
  "@siheom/react-native",
  "@siheom/ime",
  "@siheom/vitest-browser-react",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isPublished(name, version) {
  const result = spawnSync(
    "yarn",
    ["npm", "info", `${name}@${version}`, "--fields", "version", "--json"],
    { cwd: ROOT, encoding: "utf8" },
  );
  return result.status === 0 && JSON.parse(result.stdout).version === version;
}

function publishPackage(packageName, { otp, dryRun }) {
  const dirName = packageName.replace("@siheom/", "");
  const packageDir = join(PACKAGES_DIR, dirName);
  const pkgJson = readJson(join(packageDir, "package.json"));

  if (pkgJson.private) {
    return { name: packageName, version: pkgJson.version, result: "private" };
  }

  if (isPublished(pkgJson.name, pkgJson.version)) {
    return { name: packageName, version: pkgJson.version, result: "skipped" };
  }

  const args = ["workspace", packageName, "npm", "publish", "--access", "public"];
  if (otp) {
    args.push("--otp", otp);
  }
  if (dryRun) {
    args.push("--dry-run");
  }

  const result = spawnSync("yarn", args, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Failed to publish ${pkgJson.name}@${pkgJson.version}`);
  }

  return {
    name: packageName,
    version: pkgJson.version,
    result: dryRun ? "dry-run" : "published",
  };
}

function parseArgs(argv) {
  const otpIndex = argv.indexOf("--otp");
  return {
    otp: otpIndex >= 0 ? argv[otpIndex + 1] : undefined,
    dryRun: argv.includes("--dry-run"),
    packages: argv.filter((arg) => arg.startsWith("@siheom/")),
  };
}

const { otp, dryRun, packages } = parseArgs(process.argv.slice(2));
const targets =
  packages.length > 0
    ? PUBLISH_ORDER.filter((name) => packages.includes(name))
    : PUBLISH_ORDER.filter((name) => {
        const dirName = name.replace("@siheom/", "");
        const pkgJson = readJson(join(PACKAGES_DIR, dirName, "package.json"));
        return !pkgJson.private;
      });

const results = [];
for (const packageName of targets) {
  results.push(publishPackage(packageName, { otp, dryRun }));
}

for (const result of results) {
  console.log(`${result.name}@${result.version}: ${result.result}`);
}

const failed = results.some((result) => result.result === "failed");
process.exit(failed ? 1 : 0);
