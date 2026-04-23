import { z } from "zod";
import { USER_ROLES } from "@/domains/users/roles";

export const createUserSchema = z.object({
	name: z.string(),
	email: z.email(),
	password: z.string(),
	cpf: z.string().min(11).max(11),
	role: z.enum(USER_ROLES).default(USER_ROLES[0]),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
