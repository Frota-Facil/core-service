import { z } from "zod";

export const trackResponseSchema = z.object({
	id: z.uuid(),
	routeId: z.uuid(),
	xCoordinate: z.number().int(),
	yCoordinate: z.number().int(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type TrackResponseDTO = z.infer<typeof trackResponseSchema>;
