import {
	type TripResponseDTO,
	tripResponseSchema,
} from "@/contracts/routes/trip-response-schema";
import { findTripsByUserId } from "@/domains/routes/db/repository";

export async function fetchMyTripsUseCase(
	userId: string,
): Promise<TripResponseDTO[]> {
	const trips = await findTripsByUserId(userId);

	return trips.map((trip) => tripResponseSchema.parse(trip));
}
