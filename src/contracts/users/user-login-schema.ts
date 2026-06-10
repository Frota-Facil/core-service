import { z } from "zod";

export const userLoginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export type UserLoginDTO = z.infer<typeof userLoginSchema>;

export const adminLoginSchema = z.object({
	cpf: z.string().min(11).max(11),
	password: z.string().min(1),
});

export type AdminLoginDTO = z.infer<typeof adminLoginSchema>;
