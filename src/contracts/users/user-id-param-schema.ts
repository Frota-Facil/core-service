import { z } from "zod";

export const userIdParamSchema = z.object({
	id: z.uuid(),
});

export type UserIdParamDTO = z.infer<typeof userIdParamSchema>;
