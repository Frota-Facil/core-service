import {
	type TripResponseDTO,
	tripResponseSchema,
} from "@/contracts/routes/trip-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import { RequestIsNotApprovedError } from "@/domains/requests/errors";
import { REQUEST_STATUS } from "@/domains/requests/status";
import {
	findTripByIdAndUserId,
	updateRouteById,
} from "@/domains/routes/db/repository";
import {
	RouteIsNotReadyError,
	RouteNotFoundError,
} from "@/domains/routes/errors";
import { ROUTE_STATUS } from "@/domains/routes/status";
import { createAuditLog } from "@/use-cases/audit-log-service";

export async function startRouteUseCase(
	routeId: string,
	userId: string,
): Promise<TripResponseDTO> {
	const trip = await findTripByIdAndUserId(routeId, userId);

	if (!trip) {
		throw new RouteNotFoundError();
	}

	if (trip.requestStatus !== REQUEST_STATUS.APPROVED) {
		throw new RequestIsNotApprovedError();
	}

	if (trip.routeStatus !== ROUTE_STATUS.READY) {
		throw new RouteIsNotReadyError();
	}

	const updatedRoute = await updateRouteById(routeId, {
		status: ROUTE_STATUS.STARTED,
		startedAt: new Date(),
	});

	if (!updatedRoute) {
		throw new RouteNotFoundError();
	}

	await createAuditLog({
		action: AUDIT_ACTIONS[9],
		entityId: updatedRoute.id,
		performedBy: userId,
	});

	return tripResponseSchema.parse({
		...trip,
		routeStatus: updatedRoute.status,
		startedAt: updatedRoute.startedAt,
	});
}
