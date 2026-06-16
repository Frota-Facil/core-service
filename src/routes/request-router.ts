import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createRequestSchema } from "@/contracts/requests/create-request-schema";
import {
	requestIdParamSchema,
	requestUserIdParamSchema,
	requestVehicleIdParamSchema,
} from "@/contracts/requests/request-params-schema";
import {
	requestResponseSchema,
	requestWithRelationsResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { requestScheduleResponseSchema } from "@/contracts/requests/request-schedule-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { approveRequestUseCase } from "@/use-cases/requests/approve-request";
import { createRequestUseCase } from "@/use-cases/requests/create-request";
import { fetchPendingRequestsUseCase } from "@/use-cases/requests/fetch-pending-requests";
import { fetchRequestsUseCase } from "@/use-cases/requests/fetch-requests";
import { fetchUserRequestsUseCase } from "@/use-cases/requests/fetch-user-requests";
import { fetchVehicleRequestsUseCase } from "@/use-cases/requests/fetch-vehicle-requests";
import { fetchVehicleScheduleUseCase } from "@/use-cases/requests/fetch-vehicle-schedule";
import { rejectRequestUseCase } from "@/use-cases/requests/reject-request";

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
			const createdRequest = await createRequestUseCase(
				request.body,
				request.user.id,
			);

			return reply.status(201).send(createdRequest);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/requests/:userId",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				params: requestUserIdParamSchema,
				response: {
					200: requestResponseSchema.array(),
				},
			},
		},
		async (request, reply) => {
			const requests = await fetchUserRequestsUseCase(request.params.userId);

			return reply.status(200).send(requests);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/requests/pending",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				response: {
					200: requestWithRelationsResponseSchema.array(),
				},
			},
		},
		async (_, reply) => {
			const requests = await fetchPendingRequestsUseCase();

			return reply.status(200).send(requests);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/requests/:vehicleId",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: requestVehicleIdParamSchema,
				response: {
					200: requestWithRelationsResponseSchema.array(),
				},
			},
		},
		async (request, reply) => {
			const requests = await fetchVehicleRequestsUseCase(
				request.params.vehicleId,
			);

			return reply.status(200).send(requests);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/requests/:vehicleId/schedule",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				params: requestVehicleIdParamSchema,
				response: {
					200: requestScheduleResponseSchema.array(),
				},
			},
		},
		async (request, reply) => {
			const schedule = await fetchVehicleScheduleUseCase(
				request.params.vehicleId,
			);

			return reply.status(200).send(schedule);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().put(
		"/admin/requests/:requestId/approve",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: requestIdParamSchema,
				response: {
					200: requestResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const updatedRequest = await approveRequestUseCase(
				request.params.requestId,
				request.user.id,
			);

			return reply.status(200).send(updatedRequest);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().put(
		"/admin/requests/:requestId/reject",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: requestIdParamSchema,
				response: {
					200: requestResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const updatedRequest = await rejectRequestUseCase(
				request.params.requestId,
				request.user.id,
			);

			return reply.status(200).send(updatedRequest);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/requests",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				response: {
					200: requestResponseSchema.array(),
				},
			},
		},
		async (_, reply) => {
			const requests = await fetchRequestsUseCase();

			return reply.status(200).send(requests);
		},
	);
}
