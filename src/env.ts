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
	RABBITMQ_USER:z.string().min(1),
	RABBITMQ_PASS:z.string().min(1)
});

export const env = envSchema.parse(process.env);

export const DATABASE_URL = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;

export const RABBITMQ_AMQP_URL = `amqp://${env.RABBITMQ_USER}:${env.RABBITMQ_PASS}@${env.RABBITMQ_AMQP_HOST}:${env.RABBITMQ_AMQP_PORT}`
