import type { CreateTrackDTO } from "@/contracts/tracks/create-track-schema";
import {
	type TrackResponseDTO,
	trackResponseSchema,
} from "@/contracts/tracks/track-response-schema";
import { findRouteById } from "@/domains/routes/db/repository";
import { RouteNotFoundError } from "@/domains/routes/errors";
import { insertTrack } from "@/domains/tracks/db/repository";

export async function createTrackUseCase(
	input: CreateTrackDTO,
): Promise<TrackResponseDTO> {
	const route = await findRouteById(input.routeId);

	if (!route) {
		throw new RouteNotFoundError();
	}

	const track = await insertTrack({
		routeId: input.routeId,
		xCoordinate: input.xCoordinate,
		yCoordinate: input.yCoordinate,
	});

	return trackResponseSchema.parse(track);
}
