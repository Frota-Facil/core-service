import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createUserSchema } from "@/contracts/users/create-user-schema";
import { userResponseSchema } from "@/contracts/users/user-response-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { createUserUseCase } from "@/use-cases/users/create-user";
import { fetchUsersUseCase } from "@/use-cases/users/fetch-users";

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
}
