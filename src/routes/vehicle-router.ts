import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { vehicleRequestSchema } from "@/contracts/vehicles/register-vehicle-request-schema";
import { vehicleParamsSchema } from "@/contracts/vehicles/vehicle-params-schema";
import { vehicleResponseSchema } from "@/contracts/vehicles/vehicle-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { deleteVehicle } from "@/use-cases/vehicles/delete-vehicle";
import { fetchVehicles } from "@/use-cases/vehicles/fetch-vehicles";
import { registerVehicle } from "@/use-cases/vehicles/register-vehicle";
import { updateVehicle } from "@/use-cases/vehicles/update-vehicle";

export async function vehicleRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/vehicles",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])], //Primeiro verifica se o token JWT é válido, Depois verifica se o usuário é admin

			schema: {
				response: {
					200: vehicleResponseSchema.array(),
				},
			},
		},
		async (_, reply) => {
			const vehicles = await fetchVehicles();
			return reply.status(200).send(vehicles);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().post(
		"/admin/vehicles",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				body: vehicleRequestSchema,
				response: {
					201: vehicleResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const vehicle = await registerVehicle(request.body, request.user.id); //request.body -> dados do veículo, request.user.id -> id do admin que está criando

			return reply.status(201).send(vehicle);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/vehicles",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				response: {
					200: vehicleResponseSchema.array(),
				},
			},
		},
		async (_, reply) => {
			const vehicles = await fetchVehicles();
			return reply.status(200).send(vehicles);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().put(
		"/admin/vehicles/:id",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: vehicleParamsSchema,
				body: vehicleRequestSchema,
				response: {
					200: vehicleResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const vehicle = await updateVehicle(
				request.params.id,
				request.body,
				request.user.id,
			);

			return reply.status(200).send(vehicle);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().delete(
		"/admin/vehicles/:id",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: vehicleParamsSchema,
				response: {
					204: z.null(),
				},
			},
		},
		async (request, reply) => {
			await deleteVehicle(request.params.id, request.user.id);

			return reply.status(204).send(null);
		},
	);
}
