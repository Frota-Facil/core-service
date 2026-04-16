import { z } from "zod";

export const userLoginSchema = z.object({
	email: z.email(),
	password: z.string(),
});

export type UserLoginInput = z.infer<typeof userLoginSchema>;
