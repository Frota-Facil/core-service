import { env } from "@/env";

type GenerateStaticMapInput = {
	latitude: number;
	longitude: number;
};

const LOCATIONIQ_STATIC_MAP_URL = "https://maps.locationiq.com/v3/staticmap";
const LOCATIONIQ_STATIC_MAP_ZOOM = "15";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47] as const;

export async function generateLocationIqStaticMap({
	latitude,
	longitude,
}: GenerateStaticMapInput): Promise<Buffer> {
	if (!env.LOCATIONIQ_API_KEY) {
		throw new Error("LOCATIONIQ_API_KEY não configurada");
	}

	const url = new URL(LOCATIONIQ_STATIC_MAP_URL);
	url.searchParams.set("key", env.LOCATIONIQ_API_KEY);
	url.searchParams.set("center", `${latitude},${longitude}`);
	url.searchParams.set("zoom", LOCATIONIQ_STATIC_MAP_ZOOM);
	url.searchParams.set("size", "800x600");
	url.searchParams.set("format", "png");
	url.searchParams.set(
		"markers",
		`icon:large-red-cutout|${latitude},${longitude}`,
	);

	const response = await fetch(url);

	if (!response.ok) {
		const details = await response.text().catch(() => "");
		throw new Error(
			`LocationIQ respondeu ${response.status} ${response.statusText}: ${details}`,
		);
	}

	const imageBuffer = Buffer.from(await response.arrayBuffer());
	const contentType = response.headers.get("content-type") ?? "";

	if (!contentType.includes("image/png") && !isPngBuffer(imageBuffer)) {
		throw new Error(`LocationIQ retornou conteúdo inválido: ${contentType}`);
	}

	return imageBuffer;
}

function isPngBuffer(buffer: Buffer): boolean {
	return PNG_SIGNATURE.every((byte, index) => buffer[index] === byte);
}
