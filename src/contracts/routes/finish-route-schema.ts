import { z } from "zod";

export const finishRouteSchema = z.object({
	description: z.string().min(1),
});

export type FinishRouteDTO = z.infer<typeof finishRouteSchema>;
