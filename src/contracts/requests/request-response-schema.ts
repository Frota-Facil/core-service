import { z } from "zod";
import { REQUEST_STATUSES } from "@/domains/requests/status";

export const requestResponseSchema = z.object({
	id: z.uuid(),
	userId: z.uuid(),
	vehicleId: z.uuid(),
	approvedBy: z.uuid().nullish(),
	status: z.enum(REQUEST_STATUSES),
	predictedStartDate: z.date(),
	predictedEndDate: z.date(),
	reason: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type RequestResponseDTO = z.infer<typeof requestResponseSchema>;