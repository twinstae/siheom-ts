import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { reactNative } from "vitest-native";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // mock: fast pure-JS RN for library unit tests. Use engine: "native" in apps with full RN/babel setup.
  plugins: [reactNative({ engine: "mock" })],
  resolve: {
    alias: {
      "@siheom/snapshot/aria-roles": path.resolve(dirname, "../snapshot/src/a11y/ariaRoles.ts"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.tsx"],
    exclude: ["src/**/*.direct.test.tsx"],
  },
});
