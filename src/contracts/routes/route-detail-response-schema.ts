import { z } from "zod";
import { requestWithRelationsResponseSchema } from "@/contracts/requests/request-response-schema";
import { routeResponseSchema } from "@/contracts/routes/route-response-schema";
import { trackResponseSchema } from "@/contracts/tracks/track-response-schema";

export const routeDetailResponseSchema = routeResponseSchema.extend({
	request: requestWithRelationsResponseSchema,
	tracks: trackResponseSchema.array(),
});

export type RouteDetailResponseDTO = z.infer<typeof routeDetailResponseSchema>;
