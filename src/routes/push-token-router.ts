import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { PUSH_TOKEN_PLATFORMS } from "@/domains/push-tokens/schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { savePushTokenUseCase } from "@/use-cases/push-tokens/save-push-token";

const createPushTokenBodySchema = z.object({
	token: z.string().min(1),
	platform: z.enum(PUSH_TOKEN_PLATFORMS),
});

export async function pushTokenRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/push-tokens",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				body: createPushTokenBodySchema,
			},
		},
		async (request, reply) => {
			const pushToken = await savePushTokenUseCase({
				userId: request.user.id,
				token: request.body.token,
				platform: request.body.platform,
			});

			return reply.status(201).send(pushToken);
		},
	);
}
