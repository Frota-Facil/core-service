import { fastifyCors } from "@fastify/cors";
import type { FastifyError } from "fastify";
import { fastify } from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import jwtPlugin from "@/plugins/jwt";
import rabbitPlugin from "@/plugins/rabbitmq";
import { authRouter } from "@/routes/auth-router";
import { notificationRouter } from "@/routes/notification-router";
import { reportRouter } from "@/routes/report-router";
import { requestRouter } from "@/routes/request-router";
import { routeRouter } from "@/routes/route-router";
import { trackRouter } from "@/routes/track-router";
import { uploadRouter } from "@/routes/upload-router";
import { userRouter } from "@/routes/user-router";
import { vehicleRouter } from "@/routes/vehicle-router";

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
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	credentials: true,
});

app.register(jwtPlugin);

app.register(userRouter);
app.register(vehicleRouter);
app.register(authRouter);
app.register(uploadRouter);
app.register(requestRouter);
app.register(routeRouter);
app.register(trackRouter);
app.register(notificationRouter);

app.register(reportRouter);

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
