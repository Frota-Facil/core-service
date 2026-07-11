import {
	type AdminRouteResponseDTO,
	adminRouteResponseSchema,
} from "@/contracts/routes/admin-route-response-schema";
import {
	findRoutesWithDetails,
	type RouteWithDetails,
} from "@/domains/routes/db/repository";
import { ROUTE_STATUS } from "@/domains/routes/status";

const ROUTE_STATUS_ORDER = {
	[ROUTE_STATUS.STARTED]: 0,
	[ROUTE_STATUS.READY]: 1,
	[ROUTE_STATUS.FINISHED]: 2,
	[ROUTE_STATUS.PENDING]: 3,
} as const;

export async function fetchRoutesUseCase(): Promise<AdminRouteResponseDTO[]> {
	const routes = await findRoutesWithDetails();

	return [...routes]
		.sort((left, right) => {
			const statusOrder =
				ROUTE_STATUS_ORDER[left.status] - ROUTE_STATUS_ORDER[right.status];

			if (statusOrder !== 0) {
				return statusOrder;
			}

			return getRouteDate(right).getTime() - getRouteDate(left).getTime();
		})
		.map((route) =>
			adminRouteResponseSchema.parse({
				id: route.id,
				date: getRouteDate(route),
				vehicle: route.vehicle,
				driver: route.driver,
				duration: formatRouteDuration(route),
				destination: route.request.destination,
				finishedAt: route.finishedAt,
				reason: route.request.reason,
				startedAt: route.startedAt,
				status: route.status,
			}),
		);
}

function getRouteDate(route: RouteWithDetails) {
	return (
		route.finishedAt ?? route.startedAt ?? route.request.predictedStartDate
	);
}

function formatRouteDuration(route: RouteWithDetails) {
	if (route.status !== ROUTE_STATUS.FINISHED) {
		return null;
	}

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
