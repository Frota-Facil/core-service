import { z } from "zod";

export const userLoginSchema = z.object({
	cpf: z.string().min(11).max(11),
	password: z.string(),
});

export type UserLoginDTO = z.infer<typeof userLoginSchema>;
