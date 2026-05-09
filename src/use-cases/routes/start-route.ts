import {
	type RouteResponseDTO,
	routeResponseSchema,
} from "@/contracts/routes/route-response-schema";
import { findRequestById } from "@/domains/requests/db/repository";
import { RequestNotFoundError } from "@/domains/requests/errors";
import {
	findRouteByRequestId,
	insertRoute,
} from "@/domains/routes/db/repository";
import { RouteAlreadyStartedError } from "@/domains/routes/errors";
import { ROUTES_STATUSES } from "@/domains/routes/status";

export async function startRouteUseCase(
	requestId: string,
): Promise<RouteResponseDTO> {
	const request = await findRequestById(requestId);

	if (!request) {
		throw new RequestNotFoundError();
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

	return routeResponseSchema.parse(route);
}