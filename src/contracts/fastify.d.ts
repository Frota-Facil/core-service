import "@fastify/jwt";
import type { UserRoles } from "@/domains/users/roles";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: {
			id: string;
			email: string;
			role: UserRoles;
		};
		user: {
			id: string;
			email: string;
			role: UserRoles;
		};
	}
}
