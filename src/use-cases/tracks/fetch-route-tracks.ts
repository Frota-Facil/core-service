import {
	type TrackResponseDTO,
	trackResponseSchema,
} from "@/contracts/tracks/track-response-schema";
import { findRouteById } from "@/domains/routes/db/repository";
import { RouteNotFoundError } from "@/domains/routes/errors";
import { findTracksByRouteId } from "@/domains/tracks/db/repository";

export async function fetchRouteTracksUseCase(
	routeId: string,
): Promise<TrackResponseDTO[]> {
	const route = await findRouteById(routeId);

	if (!route) {
		throw new RouteNotFoundError();
	}

	const foundTracks = await findTracksByRouteId(routeId);

	return foundTracks.map((track) => trackResponseSchema.parse(track));
}
