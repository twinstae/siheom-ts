import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
/// <reference types="vitest" />

export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	root: "./",
	test: {
		setupFiles: "./test/setupTests.ts",
		include: ["test/**/*.test.tsx"],
		css: true,
		globals: true,
		pool: "vmThreads",
		poolOptions: {
			useAtomics: true,
		},
		environment: 'happy-dom',
		browser: {
			enabled: false,
			headless: false,
			provider: "playwright",
			 instances: [
                {
                    browser: 'chromium',
                    context: {
                        timezoneId: 'Asia/Seoul',
                        permissions: ["clipboard-read"]
                    },
                },
            ],
		},
		testTimeout: 3000,
	},
});