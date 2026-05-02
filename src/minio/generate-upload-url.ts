import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, MINIO_PUBLIC_URL } from "@/env";
import { s3 } from "@/minio/client";

function getExtension(contentType: string) {
	switch (contentType) {
		case "image/png":
			return "png";
		case "image/jpeg":
			return "jpg";
		case "image/webp":
			return "webp";
		default:
			throw new Error("Unsupported content type");
	}
}

export async function generateUploadUrl({
	contentType,
}: {
	contentType: string;
}) {
	const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

	if (!allowedTypes.includes(contentType)) {
		throw new Error("Invalid file type");
	}

	const ext = getExtension(contentType);
	const key = `vehicles/${randomUUID()}.${ext}`;

	const command = new PutObjectCommand({
		Bucket: env.MINIO_BUCKET,
		Key: key,
		ContentType: contentType,
	});

	const uploadUrl = await getSignedUrl(s3, command, {
		expiresIn: 60 * 5,
	});

	const fileUrl = `${MINIO_PUBLIC_URL}/${env.MINIO_BUCKET}/${key}`;

	return {
		uploadUrl,
		fileUrl,
		key,
	};
}
