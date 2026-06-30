import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { adminRouteResponseSchema } from "@/contracts/routes/admin-route-response-schema";
import { finishRouteSchema } from "@/contracts/routes/finish-route-schema";
import {
	requestIdParamSchema,
	routeIdParamSchema,
} from "@/contracts/routes/route-params-schema";
import { tripResponseSchema } from "@/contracts/routes/trip-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { fetchFinishedRoutesUseCase } from "@/use-cases/routes/fetch-finished-routes";
import { fetchMyTripUseCase } from "@/use-cases/routes/fetch-my-trip";
import { fetchMyTripsUseCase } from "@/use-cases/routes/fetch-my-trips";
import { finishRouteUseCase } from "@/use-cases/routes/finish-route";
import { startRouteUseCase } from "@/use-cases/routes/start-route";

export async function routeRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/routes",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				response: {
					200: adminRouteResponseSchema.array(),
				},
			},
		},
		async (_, reply) => {
			const routes = await fetchFinishedRoutesUseCase();

			return reply.status(200).send(routes);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().post(
		"/routes/:requestId",
		{
			preHandler: [verifyJwt],
			schema: {
				params: requestIdParamSchema,
				response: {
					200: tripResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const trip = await startRouteUseCase(
				request.params.requestId,
				request.user.id,
			);

			return reply.status(200).send(trip);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/me/trips",
		{
			preHandler: [verifyJwt],
			schema: {
				response: {
					200: tripResponseSchema.array(),
				},
			},
		},
		async (request, reply) => {
			const trips = await fetchMyTripsUseCase(request.user.id);

			return reply.status(200).send(trips);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/me/trips/:routeId",
		{
			preHandler: [verifyJwt],
			schema: {
				params: routeIdParamSchema,
				response: {
					200: tripResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const trip = await fetchMyTripUseCase(
				request.params.routeId,
				request.user.id,
			);

			return reply.status(200).send(trip);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().patch(
		"/me/trips/:routeId/start",
		{
			preHandler: [verifyJwt],
			schema: {
				params: routeIdParamSchema,
				response: {
					200: tripResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const trip = await startRouteUseCase(
				request.params.routeId,
				request.user.id,
			);

			return reply.status(200).send(trip);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().patch(
		"/me/trips/:routeId/finish",
		{
			preHandler: [verifyJwt],
			schema: {
				params: routeIdParamSchema,
				body: finishRouteSchema,
				response: {
					200: tripResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const trip = await finishRouteUseCase(
				request.params.routeId,
				request.body,
				request.user.id,
			);

			return reply.status(200).send(trip);
		},
	);
}