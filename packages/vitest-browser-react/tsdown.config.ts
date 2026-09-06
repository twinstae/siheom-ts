import { defineConfig } from "tsdown";
import { createTsdownBuildOptions } from "../../scripts/create-tsdown-build-options.mjs";

const options = createTsdownBuildOptions({
  entries: ["src/index.ts"],
});

export default defineConfig(options);
