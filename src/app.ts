import { fastifyCors } from "@fastify/cors";
import type { FastifyError } from "fastify";
import { fastify } from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import jwtPlugin from "@/plugins/jwt";
import { authRouter } from "@/routes/auth-router";
import { userRouter } from "@/routes/user-router";
import { USER_ROLES } from "./domains/users/roles";
import rabbitPlugin from "@/plugins/rabbitmq";

export const app = fastify({
	logger: {
		transport: {
			target: "pino-pretty",
			options: {
				translateTime: "HH:MM:ss Z",
			},
		},
	},
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
	origin: true,
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true,
});

app.register(jwtPlugin);

app.register(userRouter);
app.register(authRouter);

app.register(rabbitPlugin);

app.get(
	"/admin",
	{
		preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
	},
	async () => {
		return { message: "Área do admin" };
	},
);

app.setErrorHandler((error: FastifyError, _req, reply) => {
	const statusCode = error.statusCode ?? 500;
	const message = error.message ?? "Internal Server Error";

	return reply.status(statusCode).send({ message });
});
