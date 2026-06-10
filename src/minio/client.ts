import { S3Client } from "@aws-sdk/client-s3";
import { env, MINIO_ADMIN_URL, MINIO_URL } from "@/env";

export const s3 = new S3Client({
	region: "us-east-1",
	endpoint: MINIO_URL,
	credentials: {
		accessKeyId: env.MINIO_ROOT_USER,
		secretAccessKey: env.MINIO_ROOT_PASSWORD,
	},
	forcePathStyle: true,
});

export const s3Admin = new S3Client({
	region: "us-east-1",
	endpoint: MINIO_ADMIN_URL,
	credentials: {
		accessKeyId: env.MINIO_ROOT_USER,
		secretAccessKey: env.MINIO_ROOT_PASSWORD,
	},
	forcePathStyle: true,
});
