import "dotenv/config";
import { z } from "zod";

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
