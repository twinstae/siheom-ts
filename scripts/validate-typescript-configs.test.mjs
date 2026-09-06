import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

function readJson(path) {
  return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
}

test("toolchain targets Node 24", () => {
  const rootPackage = readJson("package.json");
  const miseConfig = readFileSync(new URL("../mise.toml", import.meta.url), "utf8");

  assert.deepEqual(rootPackage.engines, { node: "^24.0.0" });
  assert.equal(rootPackage.devDependencies["@types/node"], "^24.13.3");
  assert.match(miseConfig, /^node = "24\.20\.0"$/m);

  for (const workspaceRoot of ["apps", "packages"]) {
    for (const workspaceName of readdirSync(new URL(`../${workspaceRoot}`, import.meta.url))) {
      const path = `${workspaceRoot}/${workspaceName}/package.json`;
      if (!existsSync(new URL(`../${path}`, import.meta.url))) continue;
      const nodeTypes = readJson(path).devDependencies?.["@types/node"];
      if (nodeTypes) assert.equal(nodeTypes, "^24.13.3", path);
    }
  }
});

test("dependency graph has no image-size override", () => {
  const rootPackage = readJson("package.json");
  const lockfile = readFileSync(new URL("../yarn.lock", import.meta.url), "utf8");

  assert.equal("image-size@npm:^1.0.2" in rootPackage.resolutions, false);
  assert.doesNotMatch(lockfile, /@nous-research\/image-size/);
});

test("shared base keeps the Mincho compiler defaults without baseUrl", () => {
  const { compilerOptions } = readJson("configs/tsconfig-custom/tsconfig.base.json");

  assert.deepEqual(
    {
      allowSyntheticDefaultImports: compilerOptions.allowSyntheticDefaultImports,
      composite: compilerOptions.composite,
      declaration: compilerOptions.declaration,
      emitDeclarationOnly: compilerOptions.emitDeclarationOnly,
      forceConsistentCasingInFileNames: compilerOptions.forceConsistentCasingInFileNames,
      importHelpers: compilerOptions.importHelpers,
      incremental: compilerOptions.incremental,
      module: compilerOptions.module,
      moduleResolution: compilerOptions.moduleResolution,
      noFallthroughCasesInSwitch: compilerOptions.noFallthroughCasesInSwitch,
      noImplicitThis: compilerOptions.noImplicitThis,
      noUnusedLocals: compilerOptions.noUnusedLocals,
      noUnusedParameters: compilerOptions.noUnusedParameters,
      strictNullChecks: compilerOptions.strictNullChecks,
      target: compilerOptions.target,
      useDefineForClassFields: compilerOptions.useDefineForClassFields,
      verbatimModuleSyntax: compilerOptions.verbatimModuleSyntax,
    },
    {
      allowSyntheticDefaultImports: true,
      composite: true,
      declaration: true,
      emitDeclarationOnly: true,
      forceConsistentCasingInFileNames: true,
      importHelpers: true,
      incremental: true,
      module: "NodeNext",
      moduleResolution: "NodeNext",
      noFallthroughCasesInSwitch: true,
      noImplicitThis: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      strictNullChecks: true,
      target: "ESNext",
      useDefineForClassFields: true,
      verbatimModuleSyntax: false,
    },
  );
  assert.equal("baseUrl" in compilerOptions, false);
});

test("shared library configs distinguish CommonJS and Node16 ESM", () => {
  const { compilerOptions, include } = readJson("configs/tsconfig-custom/tsconfig.lib.json");

  assert.deepEqual(compilerOptions, {
    declaration: true,
    declarationMap: true,
    inlineSources: true,
    lib: ["ES2022", "DOM", "DOM.Iterable"],
    rewriteRelativeImportExtensions: true,
    rootDir: "${configDir}/src",
    sourceMap: true,
    types: [],
  });
  assert.deepEqual(include, ["${configDir}/src"]);
  assert.equal("module" in compilerOptions, false);
  assert.equal("moduleResolution" in compilerOptions, false);
  assert.deepEqual(
    readJson("configs/tsconfig-custom/tsconfig.lib.cjs.json").compilerOptions,
    {
      emitDeclarationOnly: false,
      importHelpers: false,
      module: "CommonJS",
      moduleResolution: "Node10",
      noEmit: true,
      outDir: "${configDir}/dist/cjs",
      tsBuildInfoFile: "${configDir}/.cache/typescript-cjs-buildinfo",
    },
  );
  assert.deepEqual(
    readJson("configs/tsconfig-custom/tsconfig.lib.esm.json").compilerOptions,
    {
      module: "Node16",
      moduleResolution: "Node16",
      outDir: "${configDir}/dist/esm",
      tsBuildInfoFile: "${configDir}/.cache/typescript-esm-buildinfo",
    },
  );
});

test("non-library configs keep incremental build metadata without emitting", () => {
  for (const path of [
    "configs/tsconfig-custom/tsconfig.app.json",
    "configs/tsconfig-custom/tsconfig.node.json",
  ]) {
    const { compilerOptions } = readJson(path);

    assert.deepEqual(
      {
        composite: compilerOptions.composite,
        declaration: compilerOptions.declaration,
        emitDeclarationOnly: compilerOptions.emitDeclarationOnly,
        incremental: compilerOptions.incremental,
        noEmit: compilerOptions.noEmit,
      },
      {
        composite: true,
        declaration: true,
        emitDeclarationOnly: false,
        incremental: true,
        noEmit: true,
      },
      path,
    );
  }

  const nodeConfig = readJson("configs/tsconfig-custom/tsconfig.node.json");
  assert.equal(nodeConfig.compilerOptions.rootDir, "${configDir}/../..");
  assert.deepEqual(nodeConfig.files, [
    "${configDir}/../../scripts/create-tsdown-build-options.mjs",
    "${configDir}/../../scripts/vitest-browser.ts",
  ]);
});

test("test config uses the incremental ESM profile without emitting", () => {
  const config = readJson("configs/tsconfig-custom/tsconfig.test.json");

  assert.equal(config.extends, "./tsconfig.lib.esm.json");
  assert.deepEqual(config.compilerOptions, {
    composite: true,
    declaration: true,
    declarationMap: false,
    emitDeclarationOnly: false,
    incremental: true,
    module: "ESNext",
    moduleResolution: "bundler",
    noEmit: true,
    rootDir: "${configDir}",
    types: ["node", "vitest/globals"],
  });
  assert.deepEqual(config.include, [
    "${configDir}/src",
    "${configDir}/*.d.ts",
    "${configDir}/**/*.json",
  ]);
});

test("package test configs inherit the complete source boundary", () => {
  for (const packageName of readdirSync(new URL("../packages", import.meta.url))) {
    const path = `packages/${packageName}/tsconfig.test.json`;
    if (!existsSync(new URL(`../${path}`, import.meta.url))) continue;

    assert.equal("include" in readJson(path), false, path);
  }

  for (const appName of readdirSync(new URL("../apps", import.meta.url))) {
    const path = `apps/${appName}/tsconfig.test.json`;
    if (!existsSync(new URL(`../${path}`, import.meta.url))) continue;

    assert.equal(readJson(path).include.includes("test/**/*.json"), true, path);
  }
});

test("library leaf configs only keep package-specific options", () => {
  const inheritedCompilerOptions = [
    "composite",
    "declaration",
    "declarationMap",
    "emitDeclarationOnly",
    "incremental",
    "inlineSources",
    "noEmit",
    "outDir",
    "rewriteRelativeImportExtensions",
    "rootDir",
    "sourceMap",
    "tsBuildInfoFile",
    "verbatimModuleSyntax",
  ];

  for (const packageName of readdirSync(new URL("../packages", import.meta.url))) {
    for (const format of ["cjs", "esm"]) {
      const path = `packages/${packageName}/tsconfig.${format}.json`;
      let config;

      try {
        config = readJson(path);
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
        throw error;
      }

      assert.equal(config.extends, `tsconfig-custom/tsconfig.lib.${format}.json`, path);
      const compilerOptions = config.compilerOptions ?? {};
      assert.equal("module" in compilerOptions, false, path);
      assert.equal("moduleResolution" in compilerOptions, false, path);
      if (path === "packages/ime-cdp/tsconfig.cjs.json") {
        assert.deepEqual(config.include, ["src", "vitest-browser.d.ts"], path);
      } else {
        assert.equal("include" in config, false, path);
      }
      for (const option of inheritedCompilerOptions) {
        assert.equal(option in compilerOptions, false, `${path}: ${option}`);
      }
    }
  }
});

test("build mode typechecks CJS while the package builder owns its declarations", () => {
  const cjsOptions = readJson(
    "configs/tsconfig-custom/tsconfig.lib.cjs.json",
  ).compilerOptions;

  for (const packageName of readdirSync(new URL("../packages", import.meta.url))) {
    const path = `packages/${packageName}/tsconfig.json`;
    if (!existsSync(new URL(`../${path}`, import.meta.url))) continue;
    const references = readJson(path).references.map(({ path: reference }) => reference);

    assert.equal(references.includes("./tsconfig.cjs.json"), true, path);
    assert.equal(references.includes("./tsconfig.esm.json"), true, path);
    assert.equal(cjsOptions.noEmit, true, path);
    assert.equal(cjsOptions.emitDeclarationOnly, false, path);
  }
});

test("build mode typecheck keeps non-library build info in workspace caches", () => {
  assert.equal(readJson("package.json").scripts.typecheck, "tsc --build");

  for (const [workspaceRoot, profiles] of [
    ["apps", ["app", "node", "test"]],
    ["packages", ["node", "test"]],
  ]) {
    for (const workspaceName of readdirSync(new URL(`../${workspaceRoot}`, import.meta.url))) {
      const packagePath = `${workspaceRoot}/${workspaceName}/package.json`;
      if (existsSync(new URL(`../${packagePath}`, import.meta.url))) {
        const typecheck = readJson(packagePath).scripts?.typecheck;
        if (typecheck) assert.equal(typecheck, "tsc --build", packagePath);
      }

      for (const profile of profiles) {
        const path = `${workspaceRoot}/${workspaceName}/tsconfig.${profile}.json`;
        if (!existsSync(new URL(`../${path}`, import.meta.url))) continue;

        assert.equal(
          readJson(path).compilerOptions?.tsBuildInfoFile,
          `.cache/typescript-${profile}-buildinfo`,
          path,
        );
      }
    }
  }
});

test("declaration builds preserve TypeScript build caches", () => {
  const buildOptions = readFileSync(
    new URL("../scripts/create-tsdown-build-options.mjs", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(buildOptions, /declarationCacheCleaner/);
  assert.doesNotMatch(buildOptions, /buildOptions:\s*\{[^}]*force:/s);
  assert.match(buildOptions, /typescript-\$\{format\}-dts-buildinfo/);
  assert.match(buildOptions, /typescript-\$\{format\}-dts-manifest\.json/);
  assert.match(buildOptions, /stopBuildOnErrors:\s*true/);
});
