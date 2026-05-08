import { z } from "zod";

export const vehicleParamsSchema = z.object({
	id: z.uuid(),
});

export type vehicleParamsDTO = z.infer<typeof vehicleParamsSchema>;