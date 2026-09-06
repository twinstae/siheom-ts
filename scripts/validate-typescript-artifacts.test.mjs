import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { validateTypeScriptArtifacts } from "./validate-typescript-artifacts.mjs";

function withPackage(map, assertion) {
  const packageRoot = mkdtempSync(join(tmpdir(), "siheom-artifacts-"));
  const sourceRoot = join(packageRoot, "src");
  mkdirSync(sourceRoot, { recursive: true });
  writeFileSync(join(sourceRoot, "index.ts"), "export {};\n");

  for (const [format, declaration] of [["esm", "index.d.ts"], ["cjs", "index.d.cts"]]) {
    const distDir = join(packageRoot, "dist", format);
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, declaration), `//# sourceMappingURL=${declaration}.map\n`);
    writeFileSync(
      join(distDir, `${declaration}.map`),
      JSON.stringify({ ...map, file: declaration }),
    );
  }

  try {
    assertion(packageRoot);
  } finally {
    rmSync(packageRoot, { recursive: true, force: true });
  }
}

test("accepts a sourceRoot-resolved source included in the package", () => {
  withPackage(
    { sourceRoot: "../../src", sources: ["index.ts"] },
    (packageRoot) => validateTypeScriptArtifacts(packageRoot, new Set(["src/index.ts"])),
  );
});

test("accepts an empty sourceRoot from TypeScript declaration maps", () => {
  withPackage(
    { sourceRoot: "", sources: ["../../src/index.ts"] },
    (packageRoot) => validateTypeScriptArtifacts(packageRoot, new Set(["src/index.ts"])),
  );
});

test("rejects an outside, unpacked, or empty-content map source", () => {
  withPackage(
    { sourceRoot: "../../../outside", sources: ["index.ts"] },
    (packageRoot) =>
      assert.throws(
        () => validateTypeScriptArtifacts(packageRoot, new Set()),
        /outside package/,
      ),
  );
  withPackage(
    { sourceRoot: "../../src", sources: ["index.ts"] },
    (packageRoot) =>
      assert.throws(
        () => validateTypeScriptArtifacts(packageRoot, new Set()),
        /not packed/,
      ),
  );
  withPackage(
    { sourceRoot: "../../src", sources: ["missing.ts"], sourcesContent: [""] },
    (packageRoot) =>
      assert.throws(
        () => validateTypeScriptArtifacts(packageRoot, new Set()),
        /source content is missing/,
      ),
  );
});
