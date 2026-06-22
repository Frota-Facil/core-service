import { z } from "zod";

export const updateMeSchema = z
	.object({
		name: z.string().min(1).optional(),
		phone: z.string().min(10).max(14).optional(),
	})
	.strict()
	.refine((input) => input.name !== undefined || input.phone !== undefined, {
		message: "Informe ao menos um campo para atualização",
	});

export type UpdateMeDTO = z.infer<typeof updateMeSchema>;
