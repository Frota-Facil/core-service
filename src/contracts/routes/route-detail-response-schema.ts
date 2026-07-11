import type { z } from "zod";
import { requestWithRelationsResponseSchema } from "@/contracts/requests/request-response-schema";
import { routeResponseSchema } from "@/contracts/routes/route-response-schema";
import { trackResponseSchema } from "@/contracts/tracks/track-response-schema";

const routeDetailRequestSchema = requestWithRelationsResponseSchema.extend({
	vehicle: z.object({
		id: z.uuid(),
		model: z.string(),
		plate: z.string(),
	}),
	approvedByUser: z
		.object({
			id: z.uuid(),
			name: z.string(),
		})
		.nullish(),
});

export const routeDetailResponseSchema = routeResponseSchema.extend({
	request: routeDetailRequestSchema,
	tracks: trackResponseSchema.array(),
});

export type RouteDetailResponseDTO = z.infer<typeof routeDetailResponseSchema>;
