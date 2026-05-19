import { z } from "zod";

export const generateFleetReportSchema = z
	.object({
		startDate: z.coerce.date().optional(),
		endDate: z.coerce.date().optional(),
		extraContext: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.startDate && data.endDate) {
				return data.endDate >= data.startDate;
			}

			return true;
		},
		{
			message: "A data final deve ser maior ou igual à data inicial",
			path: ["endDate"],
		},
	);

export type GenerateFleetReportDTO = z.infer<typeof generateFleetReportSchema>;

export const generatedMarkdownReportResponseSchema = z.object({
	file_name: z.string(),
	content_type: z.string(),
	markdown_content: z.string(),
});

export type GeneratedMarkdownReportResponseDTO = z.infer<
	typeof generatedMarkdownReportResponseSchema
>;

export const savedFleetReportResponseSchema = z.object({
	file_name: z.string(),
	content_type: z.string(),
	bucket: z.string(),
	object_name: z.string(),
	file_url: z.string(),
});

export type SavedFleetReportResponseDTO = z.infer<
	typeof savedFleetReportResponseSchema
>;