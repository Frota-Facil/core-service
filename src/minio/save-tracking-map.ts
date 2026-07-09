import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env, MINIO_ADMIN_URL } from "@/env";
import { s3 } from "@/minio/client";

type SaveTrackingMapInput = {
	imageBuffer: Buffer;
	routeId: string;
	trackId: string;
};

type SaveTrackingMapOutput = {
	bucket: string;
	imageKey: string;
	imageUrl: string;
};

export async function saveTrackingMapToMinio({
	imageBuffer,
	routeId,
	trackId,
}: SaveTrackingMapInput): Promise<SaveTrackingMapOutput> {
	const imageKey = `tracks/${routeId}/${trackId}.png`;

	const command = new PutObjectCommand({
		Bucket: env.MINIO_BUCKET,
		Key: imageKey,
		Body: imageBuffer,
		ContentType: "image/png",
	});

	await s3.send(command);

	return {
		bucket: env.MINIO_BUCKET,
		imageKey,
		imageUrl: `${MINIO_ADMIN_URL}/${env.MINIO_BUCKET}/${imageKey}`,
	};
}
