import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRoles } from "@/domains/users/roles";

export function authorize(allowedRoles: UserRoles[]) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const user = request.user;

		if (!user) {
			return reply.status(401).send({ error: "Não autenticado" });
		}

		if (!allowedRoles.includes(user.role)) {
			return reply.status(403).send({ error: "Sem permissão" });
		}
	};
}
