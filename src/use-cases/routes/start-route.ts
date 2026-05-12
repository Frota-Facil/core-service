import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	type RouteResponseDTO,
	routeResponseSchema,
} from "@/contracts/routes/route-response-schema";
import { findRequestById } from "@/domains/requests/db/repository";
import {
	RequestIsNotApprovedError,
	RequestNotFoundError,
} from "@/domains/requests/errors";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import {
	findRouteByRequestId,
	insertRoute,
} from "@/domains/routes/db/repository";
import { RouteAlreadyStartedError } from "@/domains/routes/errors";
import { ROUTES_STATUSES } from "@/domains/routes/status";
import { createAuditLog } from "@/use-cases/audit-log-service";

export async function startRouteUseCase(
	requestId: string,
	performedBy?: string,
): Promise<RouteResponseDTO> {
	const request = await findRequestById(requestId);

	if (!request) {
		throw new RequestNotFoundError();
	}

	if (request.status !== REQUEST_STATUSES[1]) {
		throw new RequestIsNotApprovedError();
	}

	const existingRoute = await findRouteByRequestId(requestId);

	if (existingRoute) {
		throw new RouteAlreadyStartedError();
	}

	const route = await insertRoute({
		requestId,
		status: ROUTES_STATUSES[2], // STARTED
		description: null,
		startedAt: new Date(),
	});

	await createAuditLog({
		action: AUDIT_ACTIONS[9], // TRIP.STARTED
		entityId: route.id,
		performedBy,
	});

	return routeResponseSchema.parse(route);
}