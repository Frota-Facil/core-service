import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createUserSchema } from "@/contracts/users/create-user-schema";
import { userResponseSchema } from "@/contracts/users/user-response-schema";
import { createUserUseCase } from "@/use-cases/users/create-user";

export async function userRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/users",
		{
			schema: {
				body: createUserSchema,
				response: {
					201: userResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const user = await createUserUseCase(request.body);
			return reply.status(201).send(user);
		},
	);
}
