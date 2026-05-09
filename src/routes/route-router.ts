import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { finishRouteSchema } from "@/contracts/routes/finish-route-schema";
import {
	requestIdParamSchema,
	routeIdParamSchema,
} from "@/contracts/routes/route-params-schema";
import { routeResponseSchema } from "@/contracts/routes/route-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { finishRouteUseCase } from "@/use-cases/routes/finish-route";
import { startRouteUseCase } from "@/use-cases/routes/start-route";

export async function routeRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/routes/:requestId",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				params: requestIdParamSchema,
				response: {
					201: routeResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const route = await startRouteUseCase(request.params.requestId);

			return reply.status(201).send(route);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().put(
		"/routes/:routeId",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				params: routeIdParamSchema,
				body: finishRouteSchema,
				response: {
					200: routeResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const route = await finishRouteUseCase(
				request.params.routeId,
				request.body,
			);

			return reply.status(200).send(route);
		},
	);
}
