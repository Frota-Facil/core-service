import { z } from "zod";

export const generateFleetReportSchema = z.object({
	routeId: z.uuid(),
});

export type GenerateFleetReportDTO = z.infer<typeof generateFleetReportSchema>;

export const fleetReportResponseSchema = z.object({
	routeId: z.uuid(),
	markdown_content: z.string(),
});

export type FleetReportResponseDTO = z.infer<typeof fleetReportResponseSchema>;
