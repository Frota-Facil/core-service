import {
	type TripResponseDTO,
	tripResponseSchema,
} from "@/contracts/routes/trip-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	DriverScheduleConflictError,
	RequestIsNotApprovedError,
} from "@/domains/requests/errors";
import { REQUEST_STATUS } from "@/domains/requests/status";
import {
	findRouteByRequestId,
	findTripByIdAndUserId,
	startRouteForUserIfAvailable,
} from "@/domains/routes/db/repository";
import {
	DriverRouteInProgressError,
	RouteCannotBeStartedYetError,
	RouteIsNotReadyError,
	RouteNotFoundError,
} from "@/domains/routes/errors";
import { ROUTE_STATUS } from "@/domains/routes/status";
import { findUserById } from "@/domains/users/db/repository";
import { findById } from "@/domains/vehicles/db/repository";
import { VEHICLE_STATUS } from "@/domains/vehicles/status";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { publishRouteStartedEvent } from "@/use-cases/route-event-service";

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

	const startResult = await startRouteForUserIfAvailable({
		routeId,
		userId,
		vehicleId: trip.vehicle.id,
		routeData: {
			status: ROUTE_STATUS.STARTED,
			startedAt: new Date(),
		},
		vehicleStatus: VEHICLE_STATUS.IN_USE,
	});

	if (startResult.status === "active_route_conflict") {
		throw new DriverRouteInProgressError();
	}

	if (startResult.status === "not_ready") {
		throw new RouteIsNotReadyError();
	}

	if (startResult.status === "schedule_conflict") {
		throw new DriverScheduleConflictError();
	}

	if (startResult.status === "not_found") {
		throw new RouteNotFoundError();
	}

	if (startResult.status !== "started") {
		throw new RouteNotFoundError();
	}

	const { route: updatedRoute, trip: currentTrip } = startResult;

	await createAuditLog({
		action: AUDIT_ACTIONS[9],
		entityId: updatedRoute.id,
		performedBy: userId,
	});

	await notifyAdminsAboutRouteStarted({
		routeId: updatedRoute.id,
		startedAt: updatedRoute.startedAt,
		userId,
		vehicleId: trip.vehicle.id,
	});

	return tripResponseSchema.parse({
		...currentTrip,
		routeStatus: updatedRoute.status,
		startedAt: updatedRoute.startedAt,
		vehicle: {
			...currentTrip.vehicle,
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

async function notifyAdminsAboutRouteStarted(params: {
	routeId: string;
	startedAt: Date | null;
	userId: string;
	vehicleId: string;
}): Promise<void> {
	try {
		const [driver, vehicle] = await Promise.all([
			findUserById(params.userId),
			findById(params.vehicleId),
		]);

		if (!driver || !vehicle) {
			return;
		}

		publishRouteStartedEvent({
			type: "route.started",
			routeId: params.routeId,
			vehicle: {
				id: vehicle.id,
				model: vehicle.model,
			},
			driver: {
				id: driver.id,
				name: driver.name,
			},
			startedAt: (params.startedAt ?? new Date()).toISOString(),
		});
	} catch (error) {
		console.error(
			`Erro ao notificar admins sobre início da rota ${params.routeId}:`,
			error,
		);
	}
}
