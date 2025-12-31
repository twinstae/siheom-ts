import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../test/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [],
  "framework": "@storybook/react-vite",
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: './vitest.config.ts',
      },
    },
  },
};
export default config;