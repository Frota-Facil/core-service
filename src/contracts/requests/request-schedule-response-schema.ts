import { z } from "zod";

export const requestScheduleResponseSchema = z.object({
	predictedStartDate: z.date(),
	predictedEndDate: z.date(),
});

export type RequestScheduleResponseDTO = z.infer<
	typeof requestScheduleResponseSchema
>;
