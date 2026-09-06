import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { vitestBrowserDefine, vitestBrowserMode } from "../../scripts/vitest-browser.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svelte({
      dynamicCompileOptions({ filename }) {
        if (filename.includes("node_modules")) {
          return { runes: false };
        }
      },
    }),
  ],
  define: vitestBrowserDefine,
  resolve: {
    alias: {
      "@siheom/core": path.resolve(dirname, "../core/src/index.ts"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/testSetup.ts"],
    ...vitestBrowserMode,
  },
});
