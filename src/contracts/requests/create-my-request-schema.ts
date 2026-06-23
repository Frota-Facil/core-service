import { z } from "zod";

export const createMyRequestSchema = z
	.strictObject({
		vehicleId: z.uuid(),
		predictedStartDate: z.coerce.date(),
		predictedEndDate: z.coerce.date(),
		destination: z.string().min(1),
		reason: z.string().min(1),
	})
	.refine((data) => data.predictedEndDate > data.predictedStartDate, {
		message: "A data final deve ser maior que a data inicial",
		path: ["predictedEndDate"],
	});

export type CreateMyRequestDTO = z.infer<typeof createMyRequestSchema>;
