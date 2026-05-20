import { z } from "zod";

export const generatedRouteReportResponseSchema = z.object({
	markdown_content: z.string(),
});

export type GeneratedRouteReportResponseDTO = z.infer<
	typeof generatedRouteReportResponseSchema
>;