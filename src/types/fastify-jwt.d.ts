import "@fastify/jwt";
import type { UserRoles } from "@/domains/users/roles";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		user: {
			id: string;
			role: UserRoles;
		};
	}
}