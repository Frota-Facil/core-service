import { z } from "zod";

export const uploadPresignedSchema = z.object({
	contentType: z.string(),
});

export const uploadPresignedResponseSchema = z.object({
	uploadUrl: z.string(),
	fileUrl: z.string(),
	key: z.string(),
});

export type UploadPresignedSchema = z.infer<typeof uploadPresignedSchema>;
