import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, win32 } from "node:path";
import { fileURLToPath } from "node:url";

const formats = [
  { name: "esm", declarationExtension: "ts", javascriptExtension: "mjs" },
  { name: "cjs", declarationExtension: "cts", javascriptExtension: "cjs" },
];

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(entryPath) : entry.isFile() ? [entryPath] : [];
  });
}

function parseMap(mapPath) {
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  if (map === null || Array.isArray(map) || typeof map !== "object") {
    throw new Error(`Expected source map object: ${mapPath}`);
  }
  return map;
}

function artifactKind(filePath, format) {
  const declaration = `.d.${format.declarationExtension}`;
  const javascript = `.${format.javascriptExtension}`;
  if (filePath.endsWith(`${declaration}.map`)) return "declaration-map";
  if (filePath.endsWith(declaration)) return "declaration";
  if (filePath.endsWith(`${javascript}.map`)) return "javascript-map";
  if (filePath.endsWith(javascript)) return "javascript";
  return undefined;
}

function validateArtifactMapLink(artifactPath) {
  const expectedMapName = `${basename(artifactPath)}.map`;
  const links = [...readFileSync(artifactPath, "utf8").matchAll(/\/\/# sourceMappingURL=([^\s]+)/g)];
  if (links.length !== 1 || links[0][1] !== expectedMapName) {
    throw new Error(`Invalid sourceMappingURL link: ${artifactPath}`);
  }
  if (!existsSync(`${artifactPath}.map`)) {
    throw new Error(`Missing adjacent source map: ${artifactPath}`);
  }
}

function sourceIsRelative(source) {
  return typeof source === "string" && source.length > 0 && !isAbsolute(source) && !win32.isAbsolute(source) && !source.startsWith("file:");
}

function sourceIsInPackage(sourcePath, packageRoot) {
  const pathFromPackageRoot = relative(packageRoot, sourcePath);
  return (
    pathFromPackageRoot !== ".." &&
    !pathFromPackageRoot.startsWith("..") &&
    !isAbsolute(pathFromPackageRoot)
  );
}

function packedPathsFor(packageRoot) {
  return new Set(
    execFileSync("yarn", ["pack", "--dry-run", "--json"], {
      cwd: packageRoot,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .flatMap((message) => (typeof message.location === "string" ? [message.location] : [])),
  );
}

function hasUsableSourceContent(map, index) {
  return Array.isArray(map.sourcesContent) && typeof map.sourcesContent[index] === "string" && map.sourcesContent[index].trim().length > 0;
}

function validateMapSources(map, mapPath, packageRoot, packedPaths) {
  if (!Array.isArray(map.sources) || map.sources.length === 0) {
    throw new Error(`Map has no sources: ${mapPath}`);
  }

  const sourceRoot = map.sourceRoot ?? "";
  if (typeof sourceRoot !== "string" || (sourceRoot !== "" && !sourceIsRelative(sourceRoot))) {
    throw new Error(`Map sourceRoot is not relative: ${mapPath}`);
  }

  for (const [index, source] of map.sources.entries()) {
    if (!sourceIsRelative(source)) {
      throw new Error(`Map source is not relative: ${mapPath}`);
    }
    const sourcePath = resolve(dirname(mapPath), sourceRoot, source);
    if (!sourceIsInPackage(sourcePath, packageRoot)) {
      throw new Error(`Map source is outside package: ${mapPath}`);
    }
    const packedPath = relative(packageRoot, sourcePath).split("\\").join("/");
    if (!packedPaths.has(packedPath) && !hasUsableSourceContent(map, index)) {
      if (existsSync(sourcePath)) {
        throw new Error(`Map source is not packed: ${mapPath}`);
      }
      throw new Error(`Map source content is missing: ${mapPath}`);
    }
  }
}

function validateMap(mapPath, packageRoot, packedPaths, declaration) {
  const artifactPath = mapPath.slice(0, -".map".length);
  if (!existsSync(artifactPath)) {
    throw new Error(`Map has no adjacent artifact: ${mapPath}`);
  }

  const map = parseMap(mapPath);
  if (map.file !== basename(artifactPath)) {
    throw new Error(`Map file does not match artifact: ${mapPath}`);
  }
  validateMapSources(map, mapPath, packageRoot, packedPaths);

  if (!declaration) {
    if (!Array.isArray(map.sourcesContent) || map.sourcesContent.length !== map.sources.length) {
      throw new Error(`Map sourcesContent is not aligned: ${mapPath}`);
    }
    if (map.sourcesContent.some((sourceContent) => typeof sourceContent !== "string" || sourceContent.trim().length === 0)) {
      throw new Error(`Map source content is missing: ${mapPath}`);
    }
  }
}

function validateFormatDirectory(packageRoot, packedPaths, format) {
  const distDir = join(packageRoot, "dist", format.name);
  for (const filePath of filesIn(distDir)) {
    const kind = artifactKind(filePath, format);
    if (!kind) {
      throw new Error(`Unexpected ${format.name} artifact: ${filePath}`);
    }
    if (kind.endsWith("map")) {
      validateMap(filePath, packageRoot, packedPaths, kind === "declaration-map");
    } else {
      validateArtifactMapLink(filePath);
    }
  }
}

function validateDistRoot(packageRoot) {
  const distDir = join(packageRoot, "dist");
  for (const entry of readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !formats.some((format) => format.name === entry.name)) {
      throw new Error(`Unexpected dist artifact: ${join(distDir, entry.name)}`);
    }
  }
  if (filesIn(distDir).some((filePath) => /\.d\.mts(?:\.map)?$/.test(filePath))) {
    throw new Error(`Unexpected ESM declaration extension in: ${distDir}`);
  }
}

export function validateTypeScriptArtifacts(packageDir, packedPaths) {
  const packageRoot = resolve(packageDir);
  const packed = packedPaths ?? packedPathsFor(packageRoot);
  validateDistRoot(packageRoot);
  for (const format of formats) {
    validateFormatDirectory(packageRoot, packed, format);
  }
}

export function main() {
  const packageDir = process.argv[2];
  if (!packageDir) {
    throw new Error("Usage: validate-typescript-artifacts.mjs <packageDir>");
  }
  validateTypeScriptArtifacts(packageDir);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
