import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { vehicleResponseSchema } from "@/contracts/vehicles/vehicle-response-schema";
import { vehicleRequestSchema } from "@/contracts/vehicles/register-vehicle-request-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { fetchAvailableVehicles } from "@/use-cases/vehicles/fetch-available-vehicles";
import { fetchVehicles } from "@/use-cases/vehicles/fetch-vehicles";
import { registerVehicle } from "@/use-cases/vehicles/register-vehicle";

export async function vehicleRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/vehicles",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
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
			const vehicle = await registerVehicle(request.body, request.user.id);
			return reply.status(201).send(vehicle);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().get(
		"/vehicles",
		{
			schema: {
				response: {
					200: vehicleResponseSchema.array(),
				},
			},
		},
		async (_, reply) => {
			const vehicles = await fetchAvailableVehicles();
			return reply.status(200).send(vehicles);
		},
	);
}
