import "@fastify/jwt";
import type { UserRoles } from "@/domains/users/roles";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: {
			id: string;
			cpf: string;
			role: UserRoles;
		};
		user: {
			id: string;
			cpf: string;
			role: UserRoles;
		};
	}
}
