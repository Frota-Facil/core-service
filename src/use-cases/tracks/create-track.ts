import { randomUUID } from "node:crypto";
import type { CreateTrackDTO } from "@/contracts/tracks/create-track-schema";
import {
	type TrackResponseDTO,
	trackResponseSchema,
} from "@/contracts/tracks/track-response-schema";
import { findRouteById } from "@/domains/routes/db/repository";
import { RouteNotFoundError } from "@/domains/routes/errors";
import {
	insertTrack,
	updateTrackImageById,
} from "@/domains/tracks/db/repository";
import { saveTrackingMapToMinio } from "@/minio/save-tracking-map";
import { generateLocationIqStaticMap } from "@/services/locationiq-static-map-service";
import { publishTrackCreatedEvent } from "@/use-cases/route-event-service";

export async function createTrackUseCase(
	input: CreateTrackDTO,
): Promise<TrackResponseDTO> {
	const route = await findRouteById(input.routeId);

	if (!route) {
		throw new RouteNotFoundError();
	}

	const trackId = randomUUID();
	let track = await insertTrack({
		id: trackId,
		routeId: input.routeId,
		latitude: input.latitude,
		longitude: input.longitude,
		capturedAt: input.capturedAt ?? new Date(),
	});

	try {
		const imageBuffer = await generateLocationIqStaticMap({
			latitude: input.latitude,
			longitude: input.longitude,
		});
		const savedImage = await saveTrackingMapToMinio({
			imageBuffer,
			routeId: input.routeId,
			trackId,
		});
		const trackWithImage = await updateTrackImageById(track.id, {
			imageKey: savedImage.imageKey,
			imageUrl: savedImage.imageUrl,
		});

		if (trackWithImage) {
			track = trackWithImage;
		}
	} catch (error) {
		console.error(`Erro ao gerar mapa do track ${track.id}:`, error);
	}

	const trackResponse = trackResponseSchema.parse(track);

	publishTrackCreatedEvent({
		type: "track.created",
		routeId: trackResponse.routeId,
		track: trackResponse,
	});

	return trackResponse;
}
