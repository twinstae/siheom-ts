import { dtsForCjs, dtsForEsm } from "vite-plugin-dts-build";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import ts from "typescript";

function leafExclusionsFor(format) {
  const config = ts.readConfigFile(`tsconfig.${format}.json`, ts.sys.readFile).config;
  return [...(config.exclude ?? []), "src/**/*.d.ts"];
}

function declarationCacheFor(format) {
  const cacheDir = `.cache/typescript-${format}`;
  const buildInfoFile = resolve(`.cache/typescript-${format}-dts-buildinfo`);
  const manifestFile = `.cache/typescript-${format}-dts-manifest.json`;
  const tsconfigPath = `tsconfig.${format}.json`;
  const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
  const parsed = ts.parseJsonConfigFileContent(
    { ...config, exclude: leafExclusionsFor(format) },
    ts.sys,
    process.cwd(),
    undefined,
    tsconfigPath,
  );
  const { configFilePath: _, ...leafCompilerOptions } = parsed.options;
  const compilerOptions = {
    ...leafCompilerOptions,
    noEmit: false,
    declaration: true,
    declarationMap: true,
    emitDeclarationOnly: true,
    tsBuildInfoFile: buildInfoFile,
  };
  const commandLine = {
    ...parsed,
    options: {
      ...compilerOptions,
      configFilePath: resolve(tsconfigPath),
      declarationDir: resolve(cacheDir),
    },
  };
  const rootNames = parsed.fileNames.map((file) => relative(process.cwd(), file)).sort();
  const outputs = parsed.fileNames
    .flatMap((file) => ts.getOutputFileNames(commandLine, file, false))
    .filter((file) => /\.d\.[cm]?ts(?:\.map)?$/.test(file))
    .map((file) => relative(resolve(cacheDir), file))
    .sort();

  return { buildInfoFile, cacheDir, compilerOptions, manifestFile, outputs, rootNames };
}

function filesBelow(directory, root = directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path, root) : [relative(root, path)];
  });
}

function declarationCacheGuard(cache) {
  return {
    name: `guard-declarations-${cache.cacheDir}`,
    enforce: "pre",
    buildStart() {
      let previous;
      try {
        previous = JSON.parse(readFileSync(cache.manifestFile, "utf8"));
      } catch {
        previous = undefined;
      }

      const actual = filesBelow(cache.cacheDir).sort();
      const expected = new Set(cache.outputs);
      for (const output of actual) {
        if (!expected.has(output)) rmSync(join(cache.cacheDir, output));
      }
      const intact =
        previous?.version === 1 &&
        JSON.stringify(previous.rootNames) === JSON.stringify(cache.rootNames) &&
        JSON.stringify(previous.outputs) === JSON.stringify(cache.outputs) &&
        JSON.stringify(actual) === JSON.stringify(cache.outputs);
      if (!intact) rmSync(cache.buildInfoFile, { force: true });
    },
  };
}

function dtsPluginFor(format, cache) {
  const options = {
    tsconfigPath: `tsconfig.${format}.json`,
    mode: "build",
    cacheDir: cache.cacheDir,
    outDir: `dist/${format}`,
    exclude: leafExclusionsFor(format),
    compilerOptions: {
      ...cache.compilerOptions,
    },
    buildOptions: {
      stopBuildOnErrors: true,
    },
    afterBuild() {
      writeFileSync(
        cache.manifestFile,
        `${JSON.stringify({ version: 1, rootNames: cache.rootNames, outputs: cache.outputs })}\n`,
      );
    },
  };

  return format === "esm"
    ? dtsForEsm(options)
    : dtsForCjs({ ...options, packageRedirect: false });
}

function facadeSourceMaps(format) {
  return {
    name: `facade-source-maps-${format}`,
    generateBundle(_, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk" || /\/\/# sourceMappingURL=/.test(output.code)) continue;
        if (!output.facadeModuleId) {
          throw new Error(`Cannot create a source map for ${output.fileName}`);
        }

        const mapFileName = `${output.fileName}.map`;
        const sourceIsFile = existsSync(output.facadeModuleId);
        const source = sourceIsFile
          ? relative(
              dirname(join(process.cwd(), `dist/${format}`, output.fileName)),
              output.facadeModuleId,
            ).split("\\").join("/")
          : `__generated__/${output.fileName}`;
        output.code += `//# sourceMappingURL=${basename(mapFileName)}\n`;
        this.emitFile({
          type: "asset",
          fileName: mapFileName,
          source: JSON.stringify({
            version: 3,
            file: basename(output.fileName),
            sources: [source],
            sourcesContent: [sourceIsFile ? readFileSync(output.facadeModuleId, "utf8") : output.code],
            names: [],
            mappings: "AAAA",
          }),
        });
      }
    },
  };
}

function hydrateJavaScriptMapSources(format) {
  return {
    name: `hydrate-javascript-map-sources-${format}`,
    generateBundle(_, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "asset" || !output.fileName.endsWith(`.${format === "esm" ? "mjs" : "cjs"}.map`)) continue;

        const map = JSON.parse(output.source.toString());
        if (!Array.isArray(map.sources) || !Array.isArray(map.sourcesContent)) continue;

        const mapPath = join(process.cwd(), `dist/${format}`, output.fileName);
        const sourceRoot = map.sourceRoot ?? "";
        map.sourcesContent = map.sourcesContent.map((sourceContent, index) =>
          typeof sourceContent === "string" && sourceContent.length > 0
            ? sourceContent
            : readFileSync(resolve(dirname(mapPath), sourceRoot, map.sources[index]), "utf8"),
        );
        output.source = JSON.stringify(map);
      }
    },
  };
}

/**
 * @param {{ entries: string[], neverBundle?: (string | RegExp)[] }} options
 */
export function createTsdownBuildOptions({ entries, neverBundle }) {
  const formats = /** @type {const} */ (["esm", "cjs"]);
  return formats.map((format) => {
    const cache = declarationCacheFor(format);
    return {
      entry: entries,
      format: [format],
      outDir: `dist/${format}`,
      dts: false,
      sourcemap: true,
      unbundle: true,
      plugins: [
        declarationCacheGuard(cache),
        dtsPluginFor(format, cache),
        facadeSourceMaps(format),
        hydrateJavaScriptMapSources(format),
      ],
      ...(neverBundle ? { deps: { neverBundle } } : {}),
    };
  });
}
