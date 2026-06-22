import { z } from "zod";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import { VEHICLE_STATUSES } from "@/domains/vehicles/status";
import { VEHICLE_TYPES } from "@/domains/vehicles/vehicleType";

export const myRequestResponseSchema = z.object({
	id: z.uuid(),
	userId: z.uuid(),
	vehicleId: z.uuid(),
	approvedBy: z.uuid().nullable(),
	status: z.enum(REQUEST_STATUSES),
	predictedStartDate: z.date(),
	predictedEndDate: z.date(),
	destination: z.string(),
	reason: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
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

export type MyRequestResponseDTO = z.infer<typeof myRequestResponseSchema>;
