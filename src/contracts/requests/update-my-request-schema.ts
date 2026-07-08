import { z } from "zod";

export const updateMyRequestSchema = z
	.strictObject({
		vehicleId: z.uuid().optional(),
		predictedStartDate: z.coerce.date().optional(),
		predictedEndDate: z.coerce.date().optional(),
		destination: z.string().min(1).optional(),
		reason: z.string().min(1).optional(),
	})
	.refine((data) => Object.values(data).some((value) => value !== undefined), {
		message: "Informe ao menos um campo para atualizar",
	})
	.refine(
		(data) =>
			!data.predictedStartDate ||
			!data.predictedEndDate ||
			data.predictedEndDate > data.predictedStartDate,
		{
			message: "A data final deve ser maior que a data inicial",
			path: ["predictedEndDate"],
		},
	);

export type UpdateMyRequestDTO = z.infer<typeof updateMyRequestSchema>;
