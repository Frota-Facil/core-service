import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authResponseSchema } from "@/contracts/auth-response-schema";
import { googleAuthSchema } from "@/contracts/google-auth-schema";
import {
	adminLoginSchema,
	userLoginSchema,
} from "@/contracts/users/user-login-schema";
import { getGoogleClientIds } from "@/env";
import { makeFastifyJwtService } from "@/plugins/fastify-jwt-service";
import { googleIdTokenVerifier } from "@/services/google-id-token-verifier";
import { authenticate } from "@/use-cases/authenticate";
import { authenticateAdmin } from "@/use-cases/authenticate-admin";
import { authenticateWithGoogle } from "@/use-cases/authenticate-with-google";

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
			const authResponse = await authenticate(request.body, tokenService);

			return reply.send(authResponse);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().post(
		"/admin/auth",
		{
			schema: {
				body: adminLoginSchema,
				response: {
					200: authResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const tokenService = makeFastifyJwtService(app);
			const authResponse = await authenticateAdmin(request.body, tokenService);

			return reply.send(authResponse);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().post(
		"/auth/google",
		{
			schema: {
				body: googleAuthSchema,
				response: {
					200: authResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const tokenService = makeFastifyJwtService(app);
			const authResponse = await authenticateWithGoogle(
				request.body,
				tokenService,
				googleIdTokenVerifier,
				getGoogleClientIds(),
			);

			return reply.send(authResponse);
		},
	);
}
