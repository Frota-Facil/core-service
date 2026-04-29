import { z } from "zod";
import { VEHICLE_STATUSES } from "@/domains/vehicles/status";
import { VEHICLE_TYPES } from "@/domains/vehicles/vehicleType";

export const vehicleResponseSchema = z.object({
	id: z.uuid(),
	plate: z.string(),
	model: z.string(),
	year: z.number(),
	odometer: z.number(),
	imageUrl: z.string().nullable(),
	status: z.enum(VEHICLE_STATUSES),
	type: z.enum(VEHICLE_TYPES),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type vehicleResponseDTO = z.infer<typeof vehicleResponseSchema>;
