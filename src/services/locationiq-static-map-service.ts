import { env } from "@/env";

type GenerateStaticMapInput = {
	latitude: number;
	longitude: number;
};

type StaticMapProvider = "google" | "locationiq" | "mapbox";

const LOCATIONIQ_STATIC_MAP_URL = "https://maps.locationiq.com/v3/staticmap";
const MAPBOX_STATIC_MAP_URL = "https://api.mapbox.com/styles/v1";
const GOOGLE_STATIC_MAP_URL = "https://maps.googleapis.com/maps/api/staticmap";
const STATIC_MAP_SIZE = "800x600";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47] as const;
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const LOCATIONIQ_SUPPORTED_STYLES = new Set(["streets", "light", "dark"]);

const mapboxStyleByMapImageStyle = {
	dark: "mapbox/dark-v11",
	hybrid: "mapbox/satellite-streets-v12",
	light: "mapbox/light-v11",
	roadmap: "mapbox/streets-v12",
	satellite: "mapbox/satellite-v9",
	streets: "mapbox/streets-v12",
} satisfies Record<typeof env.MAP_IMAGE_STYLE, string>;

const googleMapTypeByMapImageStyle = {
	dark: "roadmap",
	hybrid: "hybrid",
	light: "roadmap",
	roadmap: "roadmap",
	satellite: "satellite",
	streets: "roadmap",
} satisfies Record<typeof env.MAP_IMAGE_STYLE, string>;

export async function generateTrackingStaticMap({
	latitude,
	longitude,
}: GenerateStaticMapInput): Promise<Buffer> {
	const provider = getStaticMapProvider();

	if (provider === "mapbox") {
		try {
			return await generateMapboxStaticMap({ latitude, longitude });
		} catch (error) {
			console.error("Erro ao gerar mapa estático via Mapbox:", error);
			return generateLocationIqStaticMap({ latitude, longitude });
		}
	}

	if (provider === "google") {
		try {
			return await generateGoogleStaticMap({ latitude, longitude });
		} catch (error) {
			console.error("Erro ao gerar mapa estático via Google Maps:", error);
			return generateLocationIqStaticMap({ latitude, longitude });
		}
	}

	return generateLocationIqStaticMap({ latitude, longitude });
}

async function generateLocationIqStaticMap({
	latitude,
	longitude,
}: GenerateStaticMapInput): Promise<Buffer> {
	if (!env.LOCATIONIQ_API_KEY) {
		throw new Error("LOCATIONIQ_API_KEY não configurada");
	}

	const url = new URL(LOCATIONIQ_STATIC_MAP_URL);
	url.searchParams.set("key", env.LOCATIONIQ_API_KEY);
	url.searchParams.set("center", `${latitude},${longitude}`);
	url.searchParams.set("zoom", String(env.MAP_IMAGE_ZOOM));
	url.searchParams.set("size", STATIC_MAP_SIZE);
	url.searchParams.set("format", "png");
	url.searchParams.set("maptype", getLocationIqMapType());
	url.searchParams.set(
		"markers",
		`icon:large-red-cutout|${latitude},${longitude}`,
	);

	return fetchStaticMapImage(url, "LocationIQ");
}

async function generateMapboxStaticMap({
	latitude,
	longitude,
}: GenerateStaticMapInput): Promise<Buffer> {
	if (!env.MAPBOX_ACCESS_TOKEN) {
		throw new Error("MAPBOX_ACCESS_TOKEN não configurado");
	}

	const coordinates = `${formatCoordinate(longitude)},${formatCoordinate(latitude)}`;
	const style = mapboxStyleByMapImageStyle[env.MAP_IMAGE_STYLE];
	const marker = `pin-l+ff0000(${coordinates})`;
	const url = new URL(
		`${MAPBOX_STATIC_MAP_URL}/${style}/static/${marker}/${coordinates},${env.MAP_IMAGE_ZOOM}/${STATIC_MAP_SIZE}`,
	);
	url.searchParams.set("access_token", env.MAPBOX_ACCESS_TOKEN);

	return fetchStaticMapImage(url, "Mapbox");
}

async function generateGoogleStaticMap({
	latitude,
	longitude,
}: GenerateStaticMapInput): Promise<Buffer> {
	if (!env.GOOGLE_MAPS_API_KEY) {
		throw new Error("GOOGLE_MAPS_API_KEY não configurada");
	}

	const coordinates = `${formatCoordinate(latitude)},${formatCoordinate(longitude)}`;
	const url = new URL(GOOGLE_STATIC_MAP_URL);
	url.searchParams.set("center", coordinates);
	url.searchParams.set("zoom", String(env.MAP_IMAGE_ZOOM));
	url.searchParams.set("size", STATIC_MAP_SIZE);
	url.searchParams.set("format", "png");
	url.searchParams.set(
		"maptype",
		googleMapTypeByMapImageStyle[env.MAP_IMAGE_STYLE],
	);
	url.searchParams.set("markers", `color:red|${coordinates}`);
	url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

	return fetchStaticMapImage(url, "Google Maps");
}

async function fetchStaticMapImage(
	url: URL,
	providerName: string,
): Promise<Buffer> {
	const response = await fetch(url);

	if (!response.ok) {
		const details = await response.text().catch(() => "");
		throw new Error(
			`${providerName} respondeu ${response.status} ${response.statusText}: ${details}`,
		);
	}

	const imageBuffer = Buffer.from(await response.arrayBuffer());
	const contentType = response.headers.get("content-type") ?? "";

	if (!isSupportedImageBuffer(imageBuffer)) {
		throw new Error(
			`${providerName} retornou conteúdo inválido: ${contentType}`,
		);
	}

	return imageBuffer;
}

function getStaticMapProvider(): StaticMapProvider {
	if (env.MAP_IMAGE_STYLE === "satellite" || env.MAP_IMAGE_STYLE === "hybrid") {
		if (env.MAP_IMAGE_PROVIDER === "mapbox" && env.MAPBOX_ACCESS_TOKEN) {
			return "mapbox";
		}

		if (env.MAP_IMAGE_PROVIDER === "google" && env.GOOGLE_MAPS_API_KEY) {
			return "google";
		}

		if (env.MAPBOX_ACCESS_TOKEN) {
			return "mapbox";
		}

		if (env.GOOGLE_MAPS_API_KEY) {
			return "google";
		}
	}

	return env.MAP_IMAGE_PROVIDER;
}

function getLocationIqMapType() {
	if (LOCATIONIQ_SUPPORTED_STYLES.has(env.MAP_IMAGE_STYLE)) {
		return env.MAP_IMAGE_STYLE;
	}

	return "streets";
}

function formatCoordinate(value: number) {
	return value.toFixed(6);
}

function isSupportedImageBuffer(buffer: Buffer): boolean {
	return isPngBuffer(buffer) || isJpegBuffer(buffer);
}

function isPngBuffer(buffer: Buffer): boolean {
	return PNG_SIGNATURE.every((byte, index) => buffer[index] === byte);
}

function isJpegBuffer(buffer: Buffer): boolean {
	return JPEG_SIGNATURE.every((byte, index) => buffer[index] === byte);
}
