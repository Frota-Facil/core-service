import type { FinishRouteDTO } from "@/contracts/routes/finish-route-schema";
import {
	type RouteResponseDTO,
	routeResponseSchema,
} from "@/contracts/routes/route-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import { findRouteById, updateRouteById } from "@/domains/routes/db/repository";
import {
	RouteIsNotStartedError,
	RouteNotFoundError,
} from "@/domains/routes/errors";
import { ROUTES_STATUSES } from "@/domains/routes/status";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { generateRouteReportUseCase } from "@/use-cases/reports/generate-route-report";

type FinishRouteResponseDTO = Omit<RouteResponseDTO, "reportMarkdown">;

async function generateAndSaveRouteReport(routeId: string) {
	const reportMarkdown = await generateRouteReportUseCase(routeId);

	await updateRouteById(routeId, {
		reportMarkdown,
	});
}

export async function finishRouteUseCase(
	routeId: string,
	input: FinishRouteDTO,
	performedBy?: string,
): Promise<FinishRouteResponseDTO> {
	const route = await findRouteById(routeId);

	if (!route) {
		throw new RouteNotFoundError();
	}

	if (route.status !== ROUTES_STATUSES[2]) {
		throw new RouteIsNotStartedError();
	}

	const updatedRoute = await updateRouteById(routeId, {
		status: ROUTES_STATUSES[3], // FINISHED
		description: input.description,
		finishedAt: new Date(),
	});

	if (!updatedRoute) {
		throw new RouteNotFoundError();
	}

	void generateAndSaveRouteReport(routeId).catch((error) => {
		console.error(`Erro ao gerar relatório da rota ${routeId}`, error);
	});

	await createAuditLog({
		action: AUDIT_ACTIONS[10], // TRIP.FINISHED
		entityId: updatedRoute.id,
		performedBy,
	});

	const routeResponse = routeResponseSchema.parse(updatedRoute);
	delete routeResponse.reportMarkdown;

	return routeResponse;
}
