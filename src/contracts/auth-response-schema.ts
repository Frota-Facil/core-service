import { z } from "zod";

export const authResponseSchema = z.object({
	token: z.string(),
});

export type AuthResponseDTO = z.infer<typeof authResponseSchema>;
