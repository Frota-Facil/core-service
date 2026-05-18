import { z } from "zod";

export const createTrackSchema = z.object({
	routeId: z.uuid(),
	xCoordinate: z.number().int(),
	yCoordinate: z.number().int(),
	createdAt: z.date().optional(),
});

export type CreateTrackDTO = z.infer<typeof createTrackSchema>;
