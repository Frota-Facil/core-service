import {
	type AdminRouteResponseDTO,
	adminRouteResponseSchema,
} from "@/contracts/routes/admin-route-response-schema";
import {
	type FinishedRouteWithDetails,
	findFinishedRoutesWithDetails,
} from "@/domains/routes/db/repository";

export async function fetchFinishedRoutesUseCase(): Promise<
	AdminRouteResponseDTO[]
> {
	const routes = await findFinishedRoutesWithDetails();

	return routes.map((route) =>
		adminRouteResponseSchema.parse({
			id: route.id,
			date:
				route.finishedAt ?? route.startedAt ?? route.request.predictedStartDate,
			vehicle: route.vehicle,
			driver: route.driver,
			duration: formatRouteDuration(route),
			destination: route.request.destination,
			reason: route.request.reason,
			status: route.status,
		}),
	);
}

function formatRouteDuration(route: FinishedRouteWithDetails) {
	if (!route.startedAt || !route.finishedAt) {
		return null;
	}

	if (route.finishedAt.getTime() < route.startedAt.getTime()) {
		return null;
	}

	const diffInMinutes = Math.floor(
		(route.finishedAt.getTime() - route.startedAt.getTime()) / 60000,
	);
	const hours = Math.floor(diffInMinutes / 60);
	const minutes = diffInMinutes % 60;

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
	}

	return `${minutes}min`;
}
