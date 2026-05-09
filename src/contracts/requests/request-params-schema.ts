import { z } from "zod";

export const requestIdParamSchema = z.object({
	requestId: z.uuid(),
});

export type RequestIdParamDTO = z.infer<typeof requestIdParamSchema>;