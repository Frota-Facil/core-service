import type { FinishRouteDTO } from "@/contracts/routes/finish-route-schema";
import {
	type TripResponseDTO,
	tripResponseSchema,
} from "@/contracts/routes/trip-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	findTripByIdAndUserId,
	updateRouteAndVehicleStatusById,
	updateRouteById,
} from "@/domains/routes/db/repository";
import {
	RouteIsNotStartedError,
	RouteNotFoundError,
} from "@/domains/routes/errors";
import { ROUTE_STATUS } from "@/domains/routes/status";
import { VEHICLE_STATUS } from "@/domains/vehicles/status";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { generateRouteReportUseCase } from "@/use-cases/reports/generate-route-report";

async function generateAndSaveRouteReport(routeId: string) {
	const reportMarkdown = await generateRouteReportUseCase(routeId);

	await updateRouteById(routeId, {
		reportMarkdown,
	});
}

export async function finishRouteUseCase(
	routeId: string,
	input: FinishRouteDTO,
	userId: string,
): Promise<TripResponseDTO> {
	const trip = await findTripByIdAndUserId(routeId, userId);

	if (!trip) {
		throw new RouteNotFoundError();
	}

	if (trip.routeStatus !== ROUTE_STATUS.STARTED) {
		throw new RouteIsNotStartedError();
	}

	const updatedRoute = await updateRouteAndVehicleStatusById({
		routeId,
		vehicleId: trip.vehicle.id,
		routeData: {
			status: ROUTE_STATUS.FINISHED,
			description: input.description,
			finishedAt: new Date(),
		},
		vehicleStatus: VEHICLE_STATUS.AVAILABLE,
	});

	if (!updatedRoute) {
		throw new RouteNotFoundError();
	}

	void generateAndSaveRouteReport(routeId).catch((error) => {
		console.error(`Erro ao gerar relatório da rota ${routeId}`, error);
	});

	await createAuditLog({
		action: AUDIT_ACTIONS[10],
		entityId: updatedRoute.id,
		performedBy: userId,
	});

	return tripResponseSchema.parse({
		...trip,
		routeStatus: updatedRoute.status,
		description: updatedRoute.description,
		finishedAt: updatedRoute.finishedAt,
		vehicle: {
			...trip.vehicle,
			status: VEHICLE_STATUS.AVAILABLE,
		},
	});
}
