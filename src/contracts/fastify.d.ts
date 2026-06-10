import "@fastify/jwt";
import type { UserRoles } from "@/domains/users/roles";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: {
			id: string;
			role: UserRoles;
		};
		user: {
			id: string;
			role: UserRoles;
		};
	}
}
