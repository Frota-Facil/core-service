import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { paginatedAuditLogsResponseSchema } from "@/contracts/audit-logs/audit-log-response-schema";
import { fetchAuditLogsQuerySchema } from "@/contracts/audit-logs/fetch-audit-logs-query-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { fetchAuditLogsUseCase } from "@/use-cases/audit-logs/fetch-audit-logs";

export async function auditLogRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/admin/audit-logs",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				querystring: fetchAuditLogsQuerySchema,
				response: {
					200: paginatedAuditLogsResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const auditLogs = await fetchAuditLogsUseCase(request.query);

			return reply.status(200).send(auditLogs);
		},
	);
}
