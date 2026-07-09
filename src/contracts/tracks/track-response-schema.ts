import { z } from "zod";

export const trackResponseSchema = z.object({
	id: z.uuid(),
	routeId: z.uuid(),
	latitude: z.number(),
	longitude: z.number(),
	capturedAt: z.date(),
	imageUrl: z.string().nullable(),
	imageKey: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type TrackResponseDTO = z.infer<typeof trackResponseSchema>;
