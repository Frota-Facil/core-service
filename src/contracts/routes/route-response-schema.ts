import { z } from "zod";
import { ROUTES_STATUSES } from "@/domains/routes/status";

export const routeResponseSchema = z.object({
	id: z.uuid(),
	requestId: z.uuid(),
	status: z.enum(ROUTES_STATUSES),
	description: z.string().nullish(),
	startedAt: z.date().nullish(),
	finishedAt: z.date().nullish(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type RouteResponseDTO = z.infer<typeof routeResponseSchema>;