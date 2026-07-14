import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env, MINIO_PUBLIC_URL } from "@/env";
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

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;

export async function saveTrackingMapToMinio({
	imageBuffer,
	routeId,
	trackId,
}: SaveTrackingMapInput): Promise<SaveTrackingMapOutput> {
	const imageFormat = getImageFormat(imageBuffer);
	const imageKey = `tracks/${routeId}/${trackId}.${imageFormat.extension}`;

	const command = new PutObjectCommand({
		Bucket: env.MINIO_BUCKET,
		Key: imageKey,
		Body: imageBuffer,
		ContentType: imageFormat.contentType,
	});

	await s3.send(command);

	return {
		bucket: env.MINIO_BUCKET,
		imageKey,
		imageUrl: `${MINIO_PUBLIC_URL}/${env.MINIO_BUCKET}/${imageKey}`,
	};
}

function getImageFormat(imageBuffer: Buffer) {
	if (isJpegBuffer(imageBuffer)) {
		return {
			contentType: "image/jpeg",
			extension: "jpg",
		};
	}

	return {
		contentType: "image/png",
		extension: "png",
	};
}

function isJpegBuffer(buffer: Buffer): boolean {
	return JPEG_SIGNATURE.every((byte, index) => buffer[index] === byte);
}
