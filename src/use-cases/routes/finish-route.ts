import type { FinishRouteDTO } from "@/contracts/routes/finish-route-schema";
import {
	type RouteResponseDTO,
	routeResponseSchema,
} from "@/contracts/routes/route-response-schema";
import { findRouteById, updateRouteById } from "@/domains/routes/db/repository";
import {
	RouteIsNotStartedError,
	RouteNotFoundError,
} from "@/domains/routes/errors";
import { ROUTES_STATUSES } from "@/domains/routes/status";

export async function finishRouteUseCase(
	routeId: string,
	input: FinishRouteDTO,
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

	return routeResponseSchema.parse(updatedRoute);
}
