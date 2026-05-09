import { z } from "zod";

export const requestIdParamSchema = z.object({
	requestId: z.uuid(),
});

export const routeIdParamSchema = z.object({
	routeId: z.uuid(),
});

export type RequestIdParamDTO = z.infer<typeof requestIdParamSchema>;
export type RouteIdParamDTO = z.infer<typeof routeIdParamSchema>;