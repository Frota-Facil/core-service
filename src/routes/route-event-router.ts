import type { FastifyInstance } from "fastify";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { registerRouteEventClient } from "@/use-cases/route-event-service";

export async function routeEventRouter(app: FastifyInstance) {
	app.get(
		"/admin/route-events",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
		},
		async (request, reply) => {
			reply.hijack();
			reply.raw.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			});
			reply.raw.write(": connected\n\n");

			const cleanup = registerRouteEventClient(reply.raw);

			request.raw.on("close", cleanup);
		},
	);
}
