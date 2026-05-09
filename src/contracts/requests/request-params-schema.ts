import { z } from "zod";

export const requestIdParamSchema = z.object({
	requestId: z.uuid(),
});

export const requestUserIdParamSchema = z.object({
	userId: z.uuid(),
});

export const requestVehicleIdParamSchema = z.object({
	vehicleId: z.uuid(),
});

export type RequestIdParamDTO = z.infer<typeof requestIdParamSchema>;
export type RequestUserIdParamDTO = z.infer<typeof requestUserIdParamSchema>;
export type RequestVehicleIdParamDTO = z.infer<
	typeof requestVehicleIdParamSchema
>;
