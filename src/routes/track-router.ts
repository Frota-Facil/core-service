import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { routeIdParamSchema } from "@/contracts/routes/route-params-schema";
import { trackResponseSchema } from "@/contracts/tracks/track-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { fetchRouteTracksUseCase } from "@/use-cases/tracks/fetch-route-tracks";

export async function trackRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/tracks/:routeId",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: routeIdParamSchema,
				response: {
					200: trackResponseSchema.array(),
				},
			},
		},
		async (request, reply) => {
			const tracks = await fetchRouteTracksUseCase(request.params.routeId);

			return reply.status(200).send(tracks);
		},
	);
}
