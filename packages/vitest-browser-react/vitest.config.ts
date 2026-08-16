import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { vitestBrowserDefine, vitestBrowserMode } from "../../scripts/vitest-browser.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: vitestBrowserDefine,
  resolve: {
    alias: {
      "@siheom/core": path.resolve(dirname, "../core/src/index.ts"),
      "@siheom/snapshot/aria-roles": path.resolve(dirname, "../snapshot/src/a11y/ariaRoles.ts"),
      "@siheom/snapshot": path.resolve(dirname, "../snapshot/src/index.ts"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.tsx"],
    setupFiles: ["src/testSetup.ts"],
    ...vitestBrowserMode,
  },
});
