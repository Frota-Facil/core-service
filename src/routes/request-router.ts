import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createRequestSchema } from "@/contracts/requests/create-request-schema";
import { requestResponseSchema } from "@/contracts/requests/request-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { createRequestUseCase } from "@/use-cases/requests/create-request";

export async function requestRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/requests",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				body: createRequestSchema,
				response: {
					201: requestResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const createdRequest = await createRequestUseCase(request.body);

			return reply.status(201).send(createdRequest);
		},
	);
}