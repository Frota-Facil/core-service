import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	POSTGRES_USER: z.string().min(1),
	POSTGRES_PASSWORD: z.string().min(1),
	POSTGRES_DB: z.string().min(1),
	POSTGRES_HOST: z.string().default("localhost"),
	POSTGRES_PORT: z.coerce.number().default(5432),
	JWT_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);

export const DATABASE_URL = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
