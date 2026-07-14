import "dotenv/config";
import { z } from "zod";

const optionalEnvString = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z.string().min(1).optional(),
);

const mapImageProviderSchema = z.preprocess(
	(value) =>
		typeof value === "string" && value.trim()
			? value.trim().toLowerCase()
			: undefined,
	z.enum(["locationiq", "mapbox", "google"]).default("locationiq"),
);

const mapImageStyleSchema = z.preprocess(
	(value) =>
		typeof value === "string" && value.trim()
			? value.trim().toLowerCase()
			: undefined,
	z
		.enum(["streets", "light", "dark", "satellite", "hybrid", "roadmap"])
		.default("streets"),
);

const mapImageZoomSchema = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z.coerce.number().int().min(0).max(22).default(15),
);

const envSchema = z.object({
	POSTGRES_USER: z.string().min(1),
	POSTGRES_PASSWORD: z.string().min(1),
	POSTGRES_DB: z.string().min(1),
	POSTGRES_HOST: z.string().default("localhost"),
	POSTGRES_PORT: z.coerce.number().default(5432),
	RABBITMQ_AMQP_HOST: z.string().default("localhost"),
	RABBITMQ_AMQP_PORT: z.coerce.number().default(5672),
	JWT_SECRET: z.string().min(1),
	RABBITMQ_DEFAULT_USER: z.string().min(1),
	RABBITMQ_DEFAULT_PASS: z.string().min(1),
	MINIO_ROOT_USER: z.string().min(1),
	MINIO_ROOT_PASSWORD: z.string().min(1),
	MINIO_HOST: z.string().min(1),
	MINIO_ADMIN_HOST: z.string().min(1).default("localhost"),
	MINIO_PORT: z.coerce.number().default(9000),
	MINIO_BUCKET: z.string().min(1),
	LOCATIONIQ_API_KEY: optionalEnvString,
	MAP_IMAGE_PROVIDER: mapImageProviderSchema,
	MAP_IMAGE_STYLE: mapImageStyleSchema,
	MAP_IMAGE_ZOOM: mapImageZoomSchema,
	MAPBOX_ACCESS_TOKEN: optionalEnvString,
	GOOGLE_MAPS_API_KEY: optionalEnvString,

	AI_REPORT_SERVICE_URL: z
		.string()
		.url()
		.default("http://ai-report-service:8001"),
});

export const env = envSchema.parse(process.env);

export const DATABASE_URL = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;

export const RABBITMQ_AMQP_URL = `amqp://${env.RABBITMQ_DEFAULT_USER}:${env.RABBITMQ_DEFAULT_PASS}@${env.RABBITMQ_AMQP_HOST}:${env.RABBITMQ_AMQP_PORT}`;

export const MINIO_URL = `http://${env.MINIO_HOST}:${env.MINIO_PORT}`;

export const MINIO_ADMIN_URL = `http://${env.MINIO_ADMIN_HOST}:${env.MINIO_PORT}`;

export const MINIO_PUBLIC_URL = getMinioPublicUrl();

function getMinioPublicUrl() {
	const publicUrl = process.env.MINIO_PUBLIC_URL?.trim();

	if (publicUrl) {
		return removeTrailingSlashes(publicUrl);
	}

	if (
		process.env.NODE_ENV === "development" ||
		process.env.NODE_ENV === "test" ||
		process.env.CI === "true"
	) {
		return "http://localhost:9000";
	}

	throw new Error("MINIO_PUBLIC_URL is required outside development/test/CI");
}

function removeTrailingSlashes(url: string) {
	return url.replace(/\/+$/, "");
}
