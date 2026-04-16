import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authResponseSchema } from "@/contracts/auth-response-schema";
import { userLoginSchema } from "@/contracts/users/user-login-schema";
import { makeFastifyJwtService } from "@/plugins/fastify-jwt-service";
import { authenticate } from "@/use-cases/authenticate";

export async function authRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/auth",
		{
			schema: {
				body: userLoginSchema,
				response: {
					200: authResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const tokenService = makeFastifyJwtService(app);
			const token = await authenticate(request.body, tokenService);

			return reply.send({ token });
		},
	);
}
