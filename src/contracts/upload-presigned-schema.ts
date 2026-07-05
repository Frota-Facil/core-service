import { z } from "zod";

export const uploadPresignedSchema = z.object({
	contentType: z.string(),
	folder: z.enum(["vehicles", "users"]).optional(),
	uploadHost: z.string().trim().min(1).optional(),
});

export const uploadPresignedResponseSchema = z.object({
	uploadUrl: z.string(),
	fileUrl: z.string(),
	key: z.string(),
});

export type UploadPresignedSchema = z.infer<typeof uploadPresignedSchema>;
