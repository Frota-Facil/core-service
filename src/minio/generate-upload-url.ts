import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, MINIO_ADMIN_URL } from "@/env";
import { s3Admin } from "@/minio/client";

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
	folder = "vehicles",
	uploadHost,
}: {
	contentType: string;
	folder?: "vehicles" | "users";
	uploadHost?: string;
}) {
	const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

	if (!allowedTypes.includes(contentType)) {
		throw new Error("Invalid file type");
	}

	const ext = getExtension(contentType);
	const key = `${folder}/${randomUUID()}.${ext}`;

	const command = new PutObjectCommand({
		Bucket: env.MINIO_BUCKET,
		Key: key,
		ContentType: contentType,
	});

	const uploadUrl = await getSignedUrl(getUploadClient(uploadHost), command, {
		expiresIn: 60 * 5,
	});

	const fileUrl = `${MINIO_ADMIN_URL}/${env.MINIO_BUCKET}/${key}`;

	return {
		uploadUrl,
		fileUrl,
		key,
	};
}

function getUploadClient(uploadHost?: string) {
	if (!uploadHost) {
		return s3Admin;
	}

	const uploadEndpoint = new URL(MINIO_ADMIN_URL);
	const hostUrl = new URL(`${uploadEndpoint.protocol}//${uploadHost}`);

	uploadEndpoint.hostname = hostUrl.hostname;
	uploadEndpoint.port = hostUrl.port || uploadEndpoint.port;

	return new S3Client({
		region: "us-east-1",
		endpoint: uploadEndpoint.toString(),
		credentials: {
			accessKeyId: env.MINIO_ROOT_USER,
			secretAccessKey: env.MINIO_ROOT_PASSWORD,
		},
		forcePathStyle: true,
	});
}
