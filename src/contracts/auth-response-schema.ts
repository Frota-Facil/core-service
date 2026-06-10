import { z } from "zod";
import { USER_ROLES } from "@/domains/users/roles";

const authenticatedUserResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	email: z.email(),
	role: z.enum(USER_ROLES),
});

export const authResponseSchema = z.object({
	token: z.string(),
	user: authenticatedUserResponseSchema,
});

export type AuthResponseDTO = z.infer<typeof authResponseSchema>;
