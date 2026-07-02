import {
	type TripResponseDTO,
	tripResponseSchema,
} from "@/contracts/routes/trip-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import { RequestIsNotApprovedError } from "@/domains/requests/errors";
import { REQUEST_STATUS } from "@/domains/requests/status";
import {
	findRouteByRequestId,
	findTripByIdAndUserId,
	updateRouteAndVehicleStatusById,
} from "@/domains/routes/db/repository";
import {
	RouteCannotBeStartedYetError,
	RouteIsNotReadyError,
	RouteNotFoundError,
} from "@/domains/routes/errors";
import { ROUTE_STATUS } from "@/domains/routes/status";
import { VEHICLE_STATUS } from "@/domains/vehicles/status";
import { createAuditLog } from "@/use-cases/audit-log-service";

const ROUTE_START_EARLY_WINDOW_IN_MS = 15 * 60 * 1000;

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

	const earliestStartDate = new Date(
		trip.predictedStartDate.getTime() - ROUTE_START_EARLY_WINDOW_IN_MS,
	);

	if (Date.now() < earliestStartDate.getTime()) {
		throw new RouteCannotBeStartedYetError();
	}

	const updatedRoute = await updateRouteAndVehicleStatusById({
		routeId,
		vehicleId: trip.vehicle.id,
		routeData: {
			status: ROUTE_STATUS.STARTED,
			startedAt: new Date(),
		},
		vehicleStatus: VEHICLE_STATUS.IN_USE,
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
		vehicle: {
			...trip.vehicle,
			status: VEHICLE_STATUS.IN_USE,
		},
	});
}

export async function startRouteByRequestIdUseCase(
	requestId: string,
	userId: string,
): Promise<TripResponseDTO> {
	const route = await findRouteByRequestId(requestId);

	if (!route) {
		throw new RouteNotFoundError();
	}

	return startRouteUseCase(route.id, userId);
}
