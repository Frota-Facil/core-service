import { z } from "zod";
import { USER_ROLES } from "@/domains/users/roles";

export const userResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	email: z.email(),
	cpf: z.string(),
	cnh: z.string().min(11).max(11).nullish(),
	phone: z.string().min(10).max(14),
	department: z.string().nullish(),
	role: z.enum(USER_ROLES).default(USER_ROLES[0]),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type UserResponseDTO = z.infer<typeof userResponseSchema>;
