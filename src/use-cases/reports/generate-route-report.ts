import { fetchRouteReportData } from "@/domains/reports/db/repository";
import { RouteNotFoundError } from "@/domains/routes/errors";
import { requestRouteReportFromAiService } from "@/services/ai-report-service";

function toISOStringOrNull(date: Date | null): string | null {
	return date ? date.toISOString() : null;
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

		tracks: tracks.map((track) => ({
			id: track.id,
			route_id: track.routeId,
			x_coordinate: track.xCoordinate,
			y_coordinate: track.yCoordinate,
			created_at: track.createdAt.toISOString(),
			updated_at: track.updatedAt.toISOString(),
		})),

		extra_context:
			"Gere um relatório administrativo desta rota finalizada, considerando a solicitação, o veículo, a descrição final e os pontos de track registrados.",

		metadata: {
			source: "core-service",
			report_type: "route",
			total_tracks: tracks.length,
		},
	};

	const generatedReport = await requestRouteReportFromAiService(payload);

	return generatedReport.markdown_content;
}