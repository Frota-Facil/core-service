import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/env";

export default defineConfig({
	schema: "./src/drizzle/index.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: DATABASE_URL,
	},
});
