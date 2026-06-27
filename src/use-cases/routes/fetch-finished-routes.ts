import {
	adminRouteResponseSchema,
	type AdminRouteResponseDTO,
} from "@/contracts/routes/admin-route-response-schema";
import {
	findFinishedRoutesWithDetails,
	type FinishedRouteWithDetails,
} from "@/domains/routes/db/repository";

export async function fetchFinishedRoutesUseCase(): Promise<
	AdminRouteResponseDTO[]
> {
	const routes = await findFinishedRoutesWithDetails();

	return routes.map((route) =>
		adminRouteResponseSchema.parse({
			id: route.id,
			date: route.finishedAt ?? route.startedAt ?? route.request.predictedStartDate,
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
	const start = route.startedAt ?? route.request.predictedStartDate;
	const end = route.finishedAt ?? route.request.predictedEndDate;
	const diffInMinutes = Math.max(
		0,
		Math.round((end.getTime() - start.getTime()) / 60000),
	);
	const hours = Math.floor(diffInMinutes / 60);
	const minutes = diffInMinutes % 60;

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
	}

	return `${minutes}min`;
}
