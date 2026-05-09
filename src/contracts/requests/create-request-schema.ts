import { z } from "zod";

export const createRequestSchema = z
	.object({
		userId: z.uuid(),
		vehicleId: z.uuid(),
		predictedStartDate: z.coerce.date(),
		predictedEndDate: z.coerce.date(),
		reason: z.string().min(1),
	})
	.refine((data) => data.predictedEndDate > data.predictedStartDate, {
		message: "A data final deve ser maior que a data inicial",
		path: ["predictedEndDate"],
	});

export type CreateRequestDTO = z.infer<typeof createRequestSchema>;
