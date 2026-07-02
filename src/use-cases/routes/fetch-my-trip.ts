import {
	type TripResponseDTO,
	tripResponseSchema,
} from "@/contracts/routes/trip-response-schema";
import { REQUEST_STATUS } from "@/domains/requests/status";
import { findTripByIdAndUserId } from "@/domains/routes/db/repository";
import { RouteNotFoundError } from "@/domains/routes/errors";

export async function fetchMyTripUseCase(
	routeId: string,
	userId: string,
): Promise<TripResponseDTO> {
	const trip = await findTripByIdAndUserId(routeId, userId);

	if (!trip || trip.requestStatus !== REQUEST_STATUS.APPROVED) {
		throw new RouteNotFoundError();
	}

	return tripResponseSchema.parse(trip);
}
