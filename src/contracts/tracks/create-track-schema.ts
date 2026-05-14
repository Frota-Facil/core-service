import { z } from "zod";

export const createTrackSchema = z.object({
	routeId: z.uuid(),
	xCoordinate: z.number().int(),
	yCoordinate: z.number().int(),
});

export type CreateTrackDTO = z.infer<typeof createTrackSchema>;
