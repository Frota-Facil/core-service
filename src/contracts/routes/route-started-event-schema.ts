import { z } from "zod";

export const routeStartedEventSchema = z.object({
	type: z.literal("route.started"),
	routeId: z.uuid(),
	vehicle: z.object({
		id: z.uuid(),
		model: z.string(),
	}),
	driver: z.object({
		id: z.uuid(),
		name: z.string(),
	}),
	startedAt: z.string(),
});

export type RouteStartedEventDTO = z.infer<typeof routeStartedEventSchema>;
