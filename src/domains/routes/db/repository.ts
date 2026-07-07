import { and, asc, desc, eq, ne } from "drizzle-orm";

import { requests } from "@/domains/requests/schema";
import { REQUEST_STATUS } from "@/domains/requests/status";
import { routes } from "@/domains/routes/schema";
import { ROUTE_STATUS } from "@/domains/routes/status";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

export type Route = typeof routes.$inferSelect;

export type RouteWithDetails = {
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

export type FinishedRouteWithDetails = RouteWithDetails;

export type Trip = {
  id: string;
  requestId: string;
  routeStatus: (typeof routes.$inferSelect)["status"];
  requestStatus: (typeof requests.$inferSelect)["status"];
  description: string | null;
  reportMarkdown: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  predictedStartDate: Date;
  predictedEndDate: Date;
  destination: string;
  reason: string;
  vehicle: {
    id: string;
    plate: string;
    model: string;
    year: number;
    odometer: number;
    imageUrl: string |null;
    status: (typeof vehicles.$inferSelect)["status"];
    type: (typeof vehicles.$inferSelect)["type"];
  };
};

const tripColumns = {
  id: routes.id,
  requestId: routes.requestId,
  routeStatus: routes.status,
  requestStatus: requests.status,
  description: routes.description,
  reportMarkdown: routes.reportMarkdown,
  startedAt: routes.startedAt,
  finishedAt: routes.finishedAt,
  predictedStartDate: requests.predictedStartDate,
  predictedEndDate: requests.predictedEndDate,
  destination: requests.destination,
  reason: requests.reason,
  vehicle: {
    id: vehicles.id,
    plate: vehicles.plate,
    model: vehicles.model,
    year: vehicles.year,
    odometer: vehicles.odometer,
    imageUrl: vehicles.imageUrl,
    status: vehicles.status,
    type: vehicles.type,
  },
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

export async function findTripsByUserId(userId: string): Promise<Trip[]> {
	return db
		.select(tripColumns)
		.from(routes)
		.innerJoin(requests, eq(routes.requestId, requests.id))
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id))
		.where(
			and(
				eq(requests.userId, userId),
				eq(requests.status, REQUEST_STATUS.APPROVED),
				ne(routes.status, ROUTE_STATUS.FINISHED),
			),
		)
		.orderBy(asc(requests.predictedStartDate));
}

export async function findTripByIdAndUserId(
	routeId: string,
	userId: string,
): Promise<Trip | undefined> {
	const [trip] = await db
		.select(tripColumns)
		.from(routes)
		.innerJoin(requests, eq(routes.requestId, requests.id))
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id))
		.where(and(eq(routes.id, routeId), eq(requests.userId, userId)))
		.limit(1);

	return trip;
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

export async function updateRouteAndVehicleStatusById(params: {
	routeId: string;
	vehicleId: string;
	routeData: Partial<typeof routes.$inferInsert>;
	vehicleStatus: (typeof vehicles.$inferSelect)["status"];
}): Promise<Route | undefined> {
	return db.transaction(async (tx) => {
		const now = new Date();
		const [route] = await tx
			.update(routes)
			.set({
				...params.routeData,
				updatedAt: now,
			})
			.where(eq(routes.id, params.routeId))
			.returning();

		if (!route) {
			return undefined;
		}

		const [vehicle] = await tx
			.update(vehicles)
			.set({
				status: params.vehicleStatus,
				updatedAt: now,
			})
			.where(eq(vehicles.id, params.vehicleId))
			.returning({ id: vehicles.id });

		if (!vehicle) {
			throw new Error("Veículo da rota não encontrado");
		}

		return route;
	});
}

export async function updateRouteVehicleAndRequestStatusById(params: {
	routeId: string;
	vehicleId: string;
	requestId: string;
	routeData: Partial<typeof routes.$inferInsert>;
	vehicleStatus: (typeof vehicles.$inferSelect)["status"];
	requestStatus: (typeof requests.$inferSelect)["status"];
}): Promise<Route | undefined> {
	return db.transaction(async (tx) => {
		const now = new Date();
		const [route] = await tx
			.update(routes)
			.set({
				...params.routeData,
				updatedAt: now,
			})
			.where(eq(routes.id, params.routeId))
			.returning();

		if (!route) {
			return undefined;
		}

		const [vehicle] = await tx
			.update(vehicles)
			.set({
				status: params.vehicleStatus,
				updatedAt: now,
			})
			.where(eq(vehicles.id, params.vehicleId))
			.returning({ id: vehicles.id });

		if (!vehicle) {
			throw new Error("Veículo da rota não encontrado");
		}

		const [request] = await tx
			.update(requests)
			.set({
				status: params.requestStatus,
				updatedAt: now,
			})
			.where(eq(requests.id, params.requestId))
			.returning({ id: requests.id });

		if (!request) {
			throw new Error("Solicitação da rota não encontrada");
		}

		return route;
	});
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
		.where(eq(routes.status, ROUTE_STATUS.FINISHED))
		.orderBy(desc(routes.finishedAt), desc(routes.createdAt));

	return foundRoutes;
}

export async function findRoutesWithDetails(): Promise<RouteWithDetails[]> {
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
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id));

	return foundRoutes;
}
