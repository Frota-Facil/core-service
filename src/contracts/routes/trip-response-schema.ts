import { z } from "zod";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import { ROUTES_STATUSES } from "@/domains/routes/status";
import { VEHICLE_STATUSES } from "@/domains/vehicles/status";
import { VEHICLE_TYPES } from "@/domains/vehicles/vehicleType";

export const tripResponseSchema = z.object({
	id: z.uuid(),
	requestId: z.uuid(),
	routeStatus: z.enum(ROUTES_STATUSES),
	requestStatus: z.enum(REQUEST_STATUSES),
	description: z.string().nullable(),
	reportMarkdown: z.string().nullable(),
	startedAt: z.date().nullable(),
	finishedAt: z.date().nullable(),
	predictedStartDate: z.date(),
	predictedEndDate: z.date(),
	destination: z.string(),
	reason: z.string(),
	vehicle: z.object({
		id: z.uuid(),
		plate: z.string(),
		model: z.string(),
		year: z.number(),
		odometer: z.number(),
		imageUrl: z.string().nullable(),
		status: z.enum(VEHICLE_STATUSES),
		type: z.enum(VEHICLE_TYPES),
	}),
});

export type TripResponseDTO = z.infer<typeof tripResponseSchema>;
