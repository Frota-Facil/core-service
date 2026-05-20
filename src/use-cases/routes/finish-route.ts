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

export async function finishRouteUseCase(
	routeId: string,
	input: FinishRouteDTO,
	performedBy?: string,
): Promise<RouteResponseDTO> {
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

	const reportMarkdown = await generateRouteReportUseCase(routeId);

	const routeWithReport = await updateRouteById(routeId, {
		reportMarkdown,
	});

	if (!routeWithReport) {
		throw new RouteNotFoundError();
	}

	await createAuditLog({
		action: AUDIT_ACTIONS[10], // TRIP.FINISHED
		entityId: routeWithReport.id,
		performedBy,
	});

	return routeResponseSchema.parse(routeWithReport);
}