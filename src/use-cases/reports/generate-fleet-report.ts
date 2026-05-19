import type { GenerateFleetReportDTO } from "@/contracts/reports/generate-fleet-report-schema";
import { fetchRawFleetReportData } from "@/domains/reports/db/repository";
import { requestFleetReportFromAiService } from "@/services/ai-report-service";
import { saveMarkdownReportToMinio } from "@/minio/save-report";

function toISOStringOrNull(date: Date | null): string | null {
	return date ? date.toISOString() : null;
}

export async function generateFleetReportUseCase(input: GenerateFleetReportDTO) {
	const rawData = await fetchRawFleetReportData({
		startDate: input.startDate,
		endDate: input.endDate,
	});

	const payload = {
		period:
			input.startDate || input.endDate
				? {
						start: input.startDate?.toISOString(),
						end: input.endDate?.toISOString(),
					}
				: undefined,

		users: rawData.users.map((user) => ({
			id: user.id,
			name: user.name,
			department: user.department,
			role: user.role,
		})),

		vehicles: rawData.vehicles.map((vehicle) => ({
			id: vehicle.id,
			plate: vehicle.plate,
			model: vehicle.model,
			year: vehicle.year,
			odometer: vehicle.odometer,
			status: vehicle.status,
			type: vehicle.type,
		})),

		requests: rawData.requests.map((request) => ({
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
		})),

		routes: rawData.routes.map((route) => ({
			id: route.id,
			request_id: route.requestId,
			status: route.status,
			description: route.description,
			started_at: toISOStringOrNull(route.startedAt),
			finished_at: toISOStringOrNull(route.finishedAt),
			created_at: route.createdAt.toISOString(),
			updated_at: route.updatedAt.toISOString(),
		})),

		extra_context: input.extraContext,

		metadata: {
			source: "core-service",
			records_filtered_by_core: true,
			total_users: rawData.users.length,
			total_vehicles: rawData.vehicles.length,
			total_requests: rawData.requests.length,
			total_routes: rawData.routes.length,
		},
	};

	const generatedReport = await requestFleetReportFromAiService(payload);

	const savedReport = await saveMarkdownReportToMinio({
		fileName: generatedReport.file_name,
		markdownContent: generatedReport.markdown_content,
		contentType: "text/markdown; charset=utf-8",
	});

	return {
		file_name: generatedReport.file_name,
		content_type: generatedReport.content_type,
		bucket: savedReport.bucket,
		object_name: savedReport.objectName,
		file_url: savedReport.fileUrl,
	};
}