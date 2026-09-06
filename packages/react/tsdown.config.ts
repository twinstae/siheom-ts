import { defineConfig } from "tsdown";
import { createTsdownBuildOptions } from "../../scripts/create-tsdown-build-options.mjs";

const options = createTsdownBuildOptions({
  entries: ["src/index.ts", "src/imperative.ts", "src/configureTestingLibrary.ts"],
});

export default defineConfig(options);
