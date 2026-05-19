import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env, MINIO_PUBLIC_URL } from "@/env";
import { s3 } from "@/minio/client";

type SaveMarkdownReportInput = {
	fileName: string;
	markdownContent: string;
	contentType?: string;
};

type SaveMarkdownReportOutput = {
	bucket: string;
	objectName: string;
	fileUrl: string;
};

export async function saveMarkdownReportToMinio({
	fileName,
	markdownContent,
	contentType = "text/markdown; charset=utf-8",
}: SaveMarkdownReportInput): Promise<SaveMarkdownReportOutput> {
	const objectName = `reports/${fileName}`;

	const fileBuffer = Buffer.from(markdownContent, "utf-8");

	const command = new PutObjectCommand({
		Bucket: env.MINIO_BUCKET,
		Key: objectName,
		Body: fileBuffer,
		ContentType: contentType,
	});

	await s3.send(command);

	return {
		bucket: env.MINIO_BUCKET,
		objectName,
		fileUrl: `${MINIO_PUBLIC_URL}/${env.MINIO_BUCKET}/${objectName}`,
	};
}