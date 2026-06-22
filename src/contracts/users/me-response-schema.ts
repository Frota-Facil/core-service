import { z } from "zod";
import { USER_ROLES } from "@/domains/users/roles";

export const meResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	cpf: z.string(),
	email: z.email(),
	phone: z.string(),
	cnh: z.string().nullable(),
	department: z.string().nullable(),
	role: z.enum(USER_ROLES),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type MeResponseDTO = z.infer<typeof meResponseSchema>;
