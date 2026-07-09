import { z } from "zod";

export const createTrackSchema = z.object({
	routeId: z.uuid(),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	capturedAt: z.date().optional(),
});

export type CreateTrackDTO = z.infer<typeof createTrackSchema>;
