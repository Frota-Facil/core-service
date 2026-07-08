import { z } from "zod";

export const generateFleetReportSchema = z.object({
	routeId: z.uuid(),
});

export type GenerateFleetReportDTO = z.infer<typeof generateFleetReportSchema>;

export const generatedMarkdownReportResponseSchema = z.object({
	markdown_content: z.string(),
});

export type GeneratedMarkdownReportResponseDTO = z.infer<
	typeof generatedMarkdownReportResponseSchema
>;

export const fleetReportResponseSchema = z.object({
	routeId: z.uuid(),
	markdown_content: z.string(),
});

export type FleetReportResponseDTO = z.infer<typeof fleetReportResponseSchema>;

export const generatedMarkdownReportResponseSchema = z.object({
	markdown_content: z.string(),
});

export type GeneratedMarkdownReportResponseDTO = z.infer<
	typeof generatedMarkdownReportResponseSchema
>;
