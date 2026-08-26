import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-native-web-vite";

// Keep resolution local to this workspace so Yarn PnP uses its dependencies.
function getAbsolutePath(packageName: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${packageName}/package.json`)));
}

const config: StorybookConfig = {
  stories: ["../test/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: getAbsolutePath("@storybook/react-native-web-vite"),
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
