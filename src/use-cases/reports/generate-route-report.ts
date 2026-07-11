import { fetchRouteReportData } from "@/domains/reports/db/repository";
import { RouteNotFoundError } from "@/domains/routes/errors";
import { requestRouteReportFromAiService } from "@/services/ai-report-service";

function toISOStringOrNull(date: Date | null): string | null {
	return date ? date.toISOString() : null;
}

type RouteReportData = NonNullable<
	Awaited<ReturnType<typeof fetchRouteReportData>>
>;
type RouteReportRoute = RouteReportData["route"];
type RouteReportTrack = RouteReportData["tracks"][number];

function calculateDurationMinutes(
	startedAt: Date | null,
	finishedAt: Date | null,
): number | undefined {
	if (!startedAt || !finishedAt) {
		return undefined;
	}

	const durationInMs = finishedAt.getTime() - startedAt.getTime();

	if (durationInMs < 0) {
		return undefined;
	}

	return Math.round((durationInMs / 60_000) * 100) / 100;
}

function buildRouteReportMetadata(
	route: RouteReportRoute,
	tracks: RouteReportTrack[],
): Record<string, unknown> {
	const metadata: Record<string, unknown> = {
		source: "core-service",
		report_type: "route",
		total_tracks: tracks.length,
	};

	const durationMinutes = calculateDurationMinutes(
		route.startedAt,
		route.finishedAt,
	);

	if (durationMinutes !== undefined) {
		metadata.duration_minutes = durationMinutes;
	}

	const capturedTimes = tracks
		.map((track) => track.capturedAt)
		.sort((a, b) => a.getTime() - b.getTime());
	const firstTrackTime = capturedTimes[0];
	const lastTrackTime = capturedTimes.at(-1);

	if (firstTrackTime) {
		metadata.first_track_time = firstTrackTime.toISOString();
	}

	if (lastTrackTime) {
		metadata.last_track_time = lastTrackTime.toISOString();
	}

	return metadata;
}

function normalizeTrackForAiService(track: RouteReportTrack) {
	return {
		id: track.id,
		route_id: track.routeId,
		latitude: track.latitude,
		longitude: track.longitude,
		captured_at: track.capturedAt.toISOString(),
		image_url: track.imageUrl,
		image_key: track.imageKey,
		created_at: track.createdAt.toISOString(),
		updated_at: track.updatedAt.toISOString(),
	};
}

export async function generateRouteReportUseCase(
	routeId: string,
): Promise<string> {
	const rawData = await fetchRouteReportData(routeId);

	if (!rawData) {
		throw new RouteNotFoundError();
	}

	const { route, request, user, vehicle, tracks } = rawData;

	const payload = {
		route: {
			id: route.id,
			request_id: route.requestId,
			status: route.status,
			description: route.description,
			started_at: toISOStringOrNull(route.startedAt),
			finished_at: toISOStringOrNull(route.finishedAt),
			created_at: route.createdAt.toISOString(),
			updated_at: route.updatedAt.toISOString(),
		},

		request: request
			? {
					id: request.id,
					user_id: request.userId,
					vehicle_id: request.vehicleId,
					approved_by: request.approvedBy,
					status: request.status,
					predicted_start_date: request.predictedStartDate.toISOString(),
					predicted_end_date: request.predictedEndDate.toISOString(),
					reason: request.reason,
					created_at: request.createdAt.toISOString(),
					updated_at: request.updatedAt.toISOString(),
				}
			: undefined,

		vehicle: vehicle
			? {
					id: vehicle.id,
					plate: vehicle.plate,
					model: vehicle.model,
					year: vehicle.year,
					odometer: vehicle.odometer,
					status: vehicle.status,
					type: vehicle.type,
				}
			: undefined,

		user: user
			? {
					id: user.id,
					name: user.name,
					department: user.department,
					role: user.role,
				}
			: undefined,

		tracks: tracks.map(normalizeTrackForAiService),

		extra_context:
			"Gere um relatório administrativo desta rota finalizada, considerando a solicitação, o veículo, a descrição final e os pontos de track registrados.",

		metadata: buildRouteReportMetadata(route, tracks),
	};

	const generatedReport = await requestRouteReportFromAiService(payload);

	return generatedReport.markdown_content;
}
