import { z } from "zod";

export const googleAuthSchema = z.object({
	idToken: z.string().min(1),
});

export type GoogleAuthDTO = z.infer<typeof googleAuthSchema>;
