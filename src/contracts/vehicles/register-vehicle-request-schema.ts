import { z } from "zod";
import { VEHICLE_STATUSES } from "@/domains/vehicles/status";
import { VEHICLE_TYPES } from "@/domains/vehicles/vehicleType";

export const vehicleRequestSchema = z.object({
	plate: z.string(),
	model: z.string(),
	year: z.number(),
	odometer: z.number(),
	imageUrl: z.string().nullable(),
	status: z.enum(VEHICLE_STATUSES),
	type: z.enum(VEHICLE_TYPES),
});

export type vehicleRequestDTO = z.infer<typeof vehicleRequestSchema>;
