import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createUserSchema } from "@/contracts/users/create-user-schema";
import { updateUserSchema } from "@/contracts/users/update-user-schema";
import { userIdParamSchema } from "@/contracts/users/user-id-param-schema";
import { userResponseSchema } from "@/contracts/users/user-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { createUserUseCase } from "@/use-cases/users/create-user";
import { deleteUserUseCase } from "@/use-cases/users/delete-user";
import { fetchUserByIdUseCase } from "@/use-cases/users/fetch-user-by-id";
import { fetchUsersUseCase } from "@/use-cases/users/fetch-users";
import { updateUserUseCase } from "@/use-cases/users/update-user";

export async function userRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/admin/users",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				body: createUserSchema,
				response: {
					201: userResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const user = await createUserUseCase(request.body, request.user.id);
			return reply.status(201).send(user);
		},
	);
	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/users",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				response: {
					200: userResponseSchema.array(),
				},
			},
		},
		async (_, reply) => {
			const users = await fetchUsersUseCase();
			return reply.status(200).send(users);
		},
	);
	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/users/:id",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: userIdParamSchema,
				response: {
					200: userResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const user = await fetchUserByIdUseCase(request.params.id);
			return reply.status(200).send(user);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().put(
		"/admin/users/:id",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: userIdParamSchema,
				body: updateUserSchema,
				response: {
					200: userResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const user = await updateUserUseCase(request.params.id, request.body);
			return reply.status(200).send(user);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().delete(
		"/admin/users/:id",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				params: userIdParamSchema,
				response: {
					204: z.null(),
				},
			},
		},
		async (request, reply) => {
			await deleteUserUseCase(request.params.id);
			return reply.status(204).send(null);
		},
	);
}
