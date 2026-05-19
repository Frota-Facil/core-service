import { and, gte, inArray, lte } from "drizzle-orm";
import { requests } from "@/domains/requests/schema";
import { routes } from "@/domains/routes/schema";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

type FetchReportDataParams = {
	startDate?: Date;
	endDate?: Date;
};

function buildRequestPeriodFilter(params: FetchReportDataParams) {
	if (params.startDate && params.endDate) {
		return and(
			lte(requests.predictedStartDate, params.endDate),
			gte(requests.predictedEndDate, params.startDate),
		);
	}

	if (params.startDate) {
		return gte(requests.predictedEndDate, params.startDate);
	}

	if (params.endDate) {
		return lte(requests.predictedStartDate, params.endDate);
	}

	return undefined;
}

export async function fetchRawFleetReportData(params: FetchReportDataParams) {
	const periodFilter = buildRequestPeriodFilter(params);

	const foundRequests = await db
		.select()
		.from(requests)
		.where(periodFilter);

	const userIds = [...new Set(foundRequests.map((request) => request.userId))];

	const vehicleIds = [
		...new Set(foundRequests.map((request) => request.vehicleId)),
	];

	const requestIds = [
		...new Set(foundRequests.map((request) => request.id)),
	];

	const foundUsers =
		userIds.length > 0
			? await db
					.select({
						id: users.id,
						name: users.name,
						department: users.department,
						role: users.role,
					})
					.from(users)
					.where(inArray(users.id, userIds))
			: [];

	const foundVehicles =
		vehicleIds.length > 0
			? await db
					.select({
						id: vehicles.id,
						plate: vehicles.plate,
						model: vehicles.model,
						year: vehicles.year,
						odometer: vehicles.odometer,
						status: vehicles.status,
						type: vehicles.type,
					})
					.from(vehicles)
					.where(inArray(vehicles.id, vehicleIds))
			: [];

	const foundRoutes =
		requestIds.length > 0
			? await db
					.select()
					.from(routes)
					.where(inArray(routes.requestId, requestIds))
			: [];

	return {
		users: foundUsers,
		vehicles: foundVehicles,
		requests: foundRequests,
		routes: foundRoutes,
	};
}