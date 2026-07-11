import { z } from "zod";
import { ROUTES_STATUSES } from "@/domains/routes/status";

export const adminRouteResponseSchema = z.object({
	id: z.uuid(),
	date: z.date(),
	vehicle: z.object({
		id: z.uuid(),
		model: z.string(),
		plate: z.string(),
	}),
	driver: z.object({
		id: z.uuid(),
		name: z.string(),
		department: z.string().nullish(),
	}),
	duration: z.string().nullable(),
	destination: z.string(),
	finishedAt: z.date().nullish(),
	reason: z.string(),
	startedAt: z.date().nullish(),
	status: z.enum(ROUTES_STATUSES),
});

export type AdminRouteResponseDTO = z.infer<typeof adminRouteResponseSchema>;
