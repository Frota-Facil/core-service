import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

loadEnv({ path: fileURLToPath(new URL(".env.example", import.meta.url)) });

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		globals: false,
		include: ["tests/**/*.spec.ts"],
		restoreMocks: true,
		clearMocks: true,
	},
});
