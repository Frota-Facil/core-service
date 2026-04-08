import { fastifyCors } from "@fastify/cors";
import type { FastifyError } from "fastify";
import { fastify } from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";

export const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
	origin: true,
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true,
});

app.setErrorHandler((error: FastifyError, _req, reply) => {
	const statusCode = error.statusCode ?? 500;
	const message = error.message ?? "Internal Server Error";

	return reply.status(statusCode).send({ message });
});