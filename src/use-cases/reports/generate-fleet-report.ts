import type {
	FleetReportResponseDTO,
	GenerateFleetReportDTO,
} from "@/contracts/reports/generate-fleet-report-schema";
import { findRouteById } from "@/domains/routes/db/repository";
import {
	RouteNotFoundError,
	RouteReportNotFoundError,
} from "@/domains/routes/errors";

export async function generateFleetReportUseCase(
	input: GenerateFleetReportDTO,
): Promise<FleetReportResponseDTO> {
	const route = await findRouteById(input.routeId);

	if (!route) {
		throw new RouteNotFoundError();
	}

	if (!route.reportMarkdown) {
		throw new RouteReportNotFoundError();
	}

	return {
		routeId: route.id,
		markdown_content: route.reportMarkdown,
	};
}
