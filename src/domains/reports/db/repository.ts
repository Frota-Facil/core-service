import { eq } from "drizzle-orm";
import { requests } from "@/domains/requests/schema";
import { routes } from "@/domains/routes/schema";
import { tracks } from "@/domains/tracks/schema";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

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
		.where(eq(tracks.routeId, routeId));

	return {
		route,
		request,
		user,
		vehicle,
		tracks: foundTracks,
	};
}