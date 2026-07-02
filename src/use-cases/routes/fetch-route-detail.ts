import {
	type RouteDetailResponseDTO,
	routeDetailResponseSchema,
} from "@/contracts/routes/route-detail-response-schema";
import { findRouteWithRequestDetailsById } from "@/domains/routes/db/repository";
import { RouteNotFoundError } from "@/domains/routes/errors";
import { findTracksByRouteId } from "@/domains/tracks/db/repository";

export async function fetchRouteDetailUseCase(
	routeId: string,
): Promise<RouteDetailResponseDTO> {
	const route = await findRouteWithRequestDetailsById(routeId);

	if (!route) {
		throw new RouteNotFoundError();
	}

	const tracks = await findTracksByRouteId(routeId);

	return routeDetailResponseSchema.parse({
		...route,
		tracks,
	});
}
