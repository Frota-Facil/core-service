import { desc, eq } from "drizzle-orm";
import { requests } from "@/domains/requests/schema";
import { routes } from "@/domains/routes/schema";
import { ROUTES_STATUSES } from "@/domains/routes/status";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

export type Route = typeof routes.$inferSelect;

export type FinishedRouteWithDetails = {
	id: string;
	status: Route["status"];
	startedAt: Date | null;
	finishedAt: Date | null;
	createdAt: Date;
	request: {
		predictedStartDate: Date;
		predictedEndDate: Date;
		destination: string;
		reason: string;
	};
	driver: {
		id: string;
		name: string;
		department: string | null;
	};
	vehicle: {
		id: string;
		model: string;
		plate: string;
	};
};

export type RouteWithRequestDetails = Route & {
	request: {
		id: string;
		userId: string;
		vehicleId: string;
		approvedBy: string | null;
		status: (typeof requests.$inferSelect)["status"];
		predictedStartDate: Date;
		predictedEndDate: Date;
		destination: string;
		reason: string;
		createdAt: Date;
		updatedAt: Date;
		user: {
			id: string;
			name: string;
		};
		vehicle: {
			id: string;
			model: string;
		};
	};
};

export async function insertRoute(
	data: typeof routes.$inferInsert,
): Promise<Route> {
	const [route] = await db.insert(routes).values(data).returning();

	return route;
}

export async function findRouteById(id: string): Promise<Route | undefined> {
	const [route] = await db
		.select()
		.from(routes)
		.where(eq(routes.id, id))
		.limit(1);

	return route;
}

export async function findRouteWithRequestDetailsById(
	id: string,
): Promise<RouteWithRequestDetails | undefined> {
	const [route] = await db
		.select({
			id: routes.id,
			requestId: routes.requestId,
			status: routes.status,
			description: routes.description,
			reportMarkdown: routes.reportMarkdown,
			startedAt: routes.startedAt,
			finishedAt: routes.finishedAt,
			createdAt: routes.createdAt,
			updatedAt: routes.updatedAt,
			request: {
				id: requests.id,
				userId: requests.userId,
				vehicleId: requests.vehicleId,
				approvedBy: requests.approvedBy,
				status: requests.status,
				predictedStartDate: requests.predictedStartDate,
				predictedEndDate: requests.predictedEndDate,
				destination: requests.destination,
				reason: requests.reason,
				createdAt: requests.createdAt,
				updatedAt: requests.updatedAt,
			},
			user: {
				id: users.id,
				name: users.name,
			},
			vehicle: {
				id: vehicles.id,
				model: vehicles.model,
			},
		})
		.from(routes)
		.innerJoin(requests, eq(routes.requestId, requests.id))
		.innerJoin(users, eq(requests.userId, users.id))
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id))
		.where(eq(routes.id, id))
		.limit(1);

	if (!route) {
		return undefined;
	}

	return {
		id: route.id,
		requestId: route.requestId,
		status: route.status,
		description: route.description,
		reportMarkdown: route.reportMarkdown,
		startedAt: route.startedAt,
		finishedAt: route.finishedAt,
		createdAt: route.createdAt,
		updatedAt: route.updatedAt,
		request: {
			...route.request,
			user: route.user,
			vehicle: route.vehicle,
		},
	};
}

export async function findRouteByRequestId(
	requestId: string,
): Promise<Route | undefined> {
	const [route] = await db
		.select()
		.from(routes)
		.where(eq(routes.requestId, requestId))
		.limit(1);

	return route;
}

export async function updateRouteById(
	id: string,
	data: Partial<typeof routes.$inferInsert>,
): Promise<Route | undefined> {
	const [route] = await db
		.update(routes)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(routes.id, id))
		.returning();

	return route;
}

export async function findFinishedRoutesWithDetails(): Promise<
	FinishedRouteWithDetails[]
> {
	const foundRoutes = await db
		.select({
			id: routes.id,
			status: routes.status,
			startedAt: routes.startedAt,
			finishedAt: routes.finishedAt,
			createdAt: routes.createdAt,
			request: {
				predictedStartDate: requests.predictedStartDate,
				predictedEndDate: requests.predictedEndDate,
				destination: requests.destination,
				reason: requests.reason,
			},
			driver: {
				id: users.id,
				name: users.name,
				department: users.department,
			},
			vehicle: {
				id: vehicles.id,
				model: vehicles.model,
				plate: vehicles.plate,
			},
		})
		.from(routes)
		.innerJoin(requests, eq(routes.requestId, requests.id))
		.innerJoin(users, eq(requests.userId, users.id))
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id))
		.where(eq(routes.status, ROUTES_STATUSES[3]))
		.orderBy(desc(routes.finishedAt), desc(routes.createdAt));

	return foundRoutes;
}
