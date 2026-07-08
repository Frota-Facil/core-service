import { z } from "zod";
import { trackResponseSchema } from "@/contracts/tracks/track-response-schema";

export const trackCreatedEventSchema = z.object({
	type: z.literal("track.created"),
	routeId: z.uuid(),
	track: trackResponseSchema,
});

export type TrackCreatedEventDTO = z.infer<typeof trackCreatedEventSchema>;
