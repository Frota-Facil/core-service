import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import { requests } from "@/domains/requests/schema";
import { routes } from "@/domains/routes/schema";
import { tracks } from "@/domains/tracks/schema";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

type FleetReportFilters = {
	startDate?: Date;
	endDate?: Date;
};

export async function fetchRouteReportData(routeId: string) {
	const [route] = await db
		.select()
		.from(routes)
		.where(eq(routes.id, routeId))
		.limit(1);

	if (!route) {
		return null;
	}

	const [request] = await db
		.select()
		.from(requests)
		.where(eq(requests.id, route.requestId))
		.limit(1);

	const [user] = request
		? await db
				.select({
					id: users.id,
					name: users.name,
					department: users.department,
					role: users.role,
				})
				.from(users)
				.where(eq(users.id, request.userId))
				.limit(1)
		: [];

	const [vehicle] = request
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
				.where(eq(vehicles.id, request.vehicleId))
				.limit(1)
		: [];

	const foundTracks = await db
		.select()
		.from(tracks)
		.where(eq(tracks.routeId, route.id))
		.orderBy(asc(tracks.capturedAt), asc(tracks.createdAt));

	return {
		route,
		request,
		user,
		vehicle,
		tracks: foundTracks,
	};
}

export async function fetchRawFleetReportData({
	startDate,
	endDate,
}: FleetReportFilters) {
	const requestFilters: SQL[] = [];
	const routeFilters: SQL[] = [];

	if (startDate) {
		requestFilters.push(gte(requests.createdAt, startDate));
		routeFilters.push(gte(routes.createdAt, startDate));
	}

	if (endDate) {
		requestFilters.push(lte(requests.createdAt, endDate));
		routeFilters.push(lte(routes.createdAt, endDate));
	}

	const foundUsers = await db
		.select({
			id: users.id,
			name: users.name,
			department: users.department,
			role: users.role,
		})
		.from(users);

	const foundVehicles = await db
		.select({
			id: vehicles.id,
			plate: vehicles.plate,
			model: vehicles.model,
			year: vehicles.year,
			odometer: vehicles.odometer,
			status: vehicles.status,
			type: vehicles.type,
		})
		.from(vehicles);

	const foundRequests =
		requestFilters.length > 0
			? await db
					.select()
					.from(requests)
					.where(and(...requestFilters))
			: await db.select().from(requests);

	const foundRoutes =
		routeFilters.length > 0
			? await db
					.select()
					.from(routes)
					.where(and(...routeFilters))
			: await db.select().from(routes);

	return {
		users: foundUsers,
		vehicles: foundVehicles,
		requests: foundRequests,
		routes: foundRoutes,
	};
}
