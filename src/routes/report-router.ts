import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
	fleetReportResponseSchema,
	generateFleetReportSchema,
} from "@/contracts/reports/generate-fleet-report-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { generateFleetReportUseCase } from "@/use-cases/reports/generate-fleet-report";

export async function reportRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/admin/reports/fleet",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				body: generateFleetReportSchema,
				response: {
					200: fleetReportResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const report = await generateFleetReportUseCase(request.body);

			return reply.status(200).send(report);
		},
	);
}
