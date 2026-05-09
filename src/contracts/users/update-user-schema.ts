import { z } from "zod";
import { USER_ROLES } from "@/domains/users/roles";

export const updateUserSchema = z.object({
	name: z.string().optional(),
	email: z.email().optional(),
	password: z.string().optional(),
	cpf: z.string().min(11).max(11).optional(),
	cnh: z.string().min(11).max(11).optional(),
	phone: z.string().min(10).max(14).optional(),
	department: z.string().optional(),
	role: z.enum(USER_ROLES).optional(),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
