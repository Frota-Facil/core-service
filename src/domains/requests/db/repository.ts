import {
	and,
	desc,
	eq,
	gt,
	inArray,
	isNotNull,
	lt,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { requests } from "@/domains/requests/schema";
import { REQUEST_STATUS } from "@/domains/requests/status";
import { routes } from "@/domains/routes/schema";
import { ROUTE_STATUS } from "@/domains/routes/status";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

export type Request = typeof requests.$inferSelect;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ScheduleConflictType = "driver" | "vehicle";

export type RequestWithRelations = Request & {
	user: {
		id: string;
		name: string;
	};
	vehicle: {
		id: string;
		model: string;
	};
};

export type RequestWithVehicle = Request & {
	vehicle: {
		id: string;
		plate: string;
		model: string;
		year: number;
		odometer: number;
		imageUrl: string | null;
		status: (typeof vehicles.$inferSelect)["status"];
		type: (typeof vehicles.$inferSelect)["type"];
	};
};

const requestWithRelationsColumns = {
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
	user: {
		id: users.id,
		name: users.name,
	},
	vehicle: {
		id: vehicles.id,
		model: vehicles.model,
	},
};

const requestWithVehicleColumns = {
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

export async function insertRequest(
	data: typeof requests.$inferInsert,
): Promise<Request> {
	const [request] = await db.insert(requests).values(data).returning();

	return request;
}

export async function insertRequestWithScheduleChecks(
	data: typeof requests.$inferInsert & {
		predictedEndDate: Date;
		predictedStartDate: Date;
		userId: string;
		vehicleId: string;
	},
): Promise<{ conflict?: ScheduleConflictType; request?: Request }> {
	return db.transaction(async (tx) => {
		await acquireScheduleLocks(tx, {
			userId: data.userId,
			vehicleId: data.vehicleId,
		});

		const vehicleConflict = await findVehicleScheduleConflictInTransaction(tx, {
			vehicleId: data.vehicleId,
			predictedStartDate: data.predictedStartDate,
			predictedEndDate: data.predictedEndDate,
		});

		if (vehicleConflict) {
			return { conflict: "vehicle" };
		}

		const driverConflict = await findDriverScheduleConflictInTransaction(tx, {
			userId: data.userId,
			predictedStartDate: data.predictedStartDate,
			predictedEndDate: data.predictedEndDate,
		});

		if (driverConflict) {
			return { conflict: "driver" };
		}

		const [request] = await tx.insert(requests).values(data).returning();

		return { request };
	});
}

export async function findRequestById(
	id: string,
): Promise<Request | undefined> {
	const [request] = await db
		.select()
		.from(requests)
		.where(eq(requests.id, id))
		.limit(1);

	return request;
}

export async function findVehicleScheduleConflict(params: {
	vehicleId: string;
	predictedStartDate: Date;
	predictedEndDate: Date;
	ignoredRequestId?: string;
}): Promise<{ id: string } | undefined> {
	const [request] = await db
		.select({ id: requests.id })
		.from(requests)
		.leftJoin(routes, eq(routes.requestId, requests.id))
		.where(
			and(
				eq(requests.vehicleId, params.vehicleId),
				params.ignoredRequestId
					? ne(requests.id, params.ignoredRequestId)
					: undefined,
				or(
					and(
						inArray(requests.status, [
							REQUEST_STATUS.PENDING,
							REQUEST_STATUS.APPROVED,
						]),
						lt(requests.predictedStartDate, params.predictedEndDate),
						gt(requests.predictedEndDate, params.predictedStartDate),
					),
					and(
						eq(requests.status, REQUEST_STATUS.COMPLETED),
						eq(routes.status, ROUTE_STATUS.FINISHED),
						isNotNull(routes.startedAt),
						isNotNull(routes.finishedAt),
						lt(routes.startedAt, params.predictedEndDate),
						gt(routes.finishedAt, params.predictedStartDate),
					),
				),
			),
		)
		.limit(1);

	return request;
}

export async function updateRequestWithScheduleChecks(
	id: string,
	data: Partial<typeof requests.$inferInsert> & {
		predictedEndDate: Date;
		predictedStartDate: Date;
		userId: string;
		vehicleId: string;
	},
): Promise<{ conflict?: ScheduleConflictType; request?: Request }> {
	return db.transaction(async (tx) => {
		await acquireScheduleLocks(tx, {
			userId: data.userId,
			vehicleId: data.vehicleId,
		});

		const vehicleConflict = await findVehicleScheduleConflictInTransaction(tx, {
			vehicleId: data.vehicleId,
			predictedStartDate: data.predictedStartDate,
			predictedEndDate: data.predictedEndDate,
			ignoredRequestId: id,
		});

		if (vehicleConflict) {
			return { conflict: "vehicle" };
		}

		const driverConflict = await findDriverScheduleConflictInTransaction(tx, {
			userId: data.userId,
			predictedStartDate: data.predictedStartDate,
			predictedEndDate: data.predictedEndDate,
			ignoredRequestId: id,
		});

		if (driverConflict) {
			return { conflict: "driver" };
		}

		const [request] = await tx
			.update(requests)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(requests.id, id))
			.returning();

		return { request };
	});
}

export async function approveRequestWithScheduleChecks(
	id: string,
	approvedBy: string,
): Promise<
	| { conflict?: undefined; request: Request; status: "approved" }
	| { conflict: ScheduleConflictType; request?: undefined; status: "conflict" }
	| { request?: undefined; status: "not_found" | "not_pending" }
> {
	return db.transaction(async (tx) => {
		const request = await findRequestByIdInTransaction(tx, id);

		if (!request) {
			return { status: "not_found" };
		}

		await acquireScheduleLocks(tx, {
			userId: request.userId,
			vehicleId: request.vehicleId,
		});

		const currentRequest = await findRequestByIdInTransaction(tx, id);

		if (!currentRequest) {
			return { status: "not_found" };
		}

		if (currentRequest.status !== REQUEST_STATUS.PENDING) {
			return { status: "not_pending" };
		}

		const vehicleConflict = await findVehicleScheduleConflictInTransaction(tx, {
			vehicleId: currentRequest.vehicleId,
			predictedStartDate: currentRequest.predictedStartDate,
			predictedEndDate: currentRequest.predictedEndDate,
			ignoredRequestId: currentRequest.id,
		});

		if (vehicleConflict) {
			return { conflict: "vehicle", status: "conflict" };
		}

		const driverConflict = await findDriverScheduleConflictInTransaction(tx, {
			userId: currentRequest.userId,
			predictedStartDate: currentRequest.predictedStartDate,
			predictedEndDate: currentRequest.predictedEndDate,
			ignoredRequestId: currentRequest.id,
		});

		if (driverConflict) {
			return { conflict: "driver", status: "conflict" };
		}

		const [updatedRequest] = await tx
			.update(requests)
			.set({
				status: REQUEST_STATUS.APPROVED,
				approvedBy,
				updatedAt: new Date(),
			})
			.where(eq(requests.id, currentRequest.id))
			.returning();

		const [existingRoute] = await tx
			.select()
			.from(routes)
			.where(eq(routes.requestId, updatedRequest.id))
			.limit(1);

		if (!existingRoute) {
			await tx.insert(routes).values({
				requestId: updatedRequest.id,
				status: ROUTE_STATUS.READY,
			});
		}

		return { request: updatedRequest, status: "approved" };
	});
}

export async function updateRequestById(
	id: string,
	data: Partial<typeof requests.$inferInsert>,
): Promise<Request | undefined> {
	const [request] = await db
		.update(requests)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(requests.id, id))
		.returning();

	return request;
}

export async function findActiveOrFutureRequestsByUserId(
	userId: string,
): Promise<Request[]> {
	const foundRequests = await db
		.select()
		.from(requests)
		.where(
			and(
				eq(requests.userId, userId),
				gt(requests.predictedEndDate, new Date()),
			),
		);

	return foundRequests;
}

export async function findRequestsByUserIdWithVehicle(
	userId: string,
): Promise<RequestWithVehicle[]> {
	const foundRequests = await db
		.select(requestWithVehicleColumns)
		.from(requests)
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id))
		.where(eq(requests.userId, userId))
		.orderBy(desc(requests.predictedStartDate));

	return foundRequests;
}

export async function findRequestsByVehicleId(
	vehicleId: string,
): Promise<RequestWithRelations[]> {
	const foundRequests = await db
		.select(requestWithRelationsColumns)
		.from(requests)
		.innerJoin(users, eq(requests.userId, users.id))
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id))
		.where(eq(requests.vehicleId, vehicleId));

	return foundRequests;
}

export async function findPendingRequests(): Promise<RequestWithRelations[]> {
	const foundRequests = await db
		.select(requestWithRelationsColumns)
		.from(requests)
		.innerJoin(users, eq(requests.userId, users.id))
		.innerJoin(vehicles, eq(requests.vehicleId, vehicles.id))
		.where(eq(requests.status, REQUEST_STATUS.PENDING));

	return foundRequests;
}

export async function findActiveOrFutureScheduleByVehicleId(
	vehicleId: string,
): Promise<
	{
		predictedStartDate: Date;
		predictedEndDate: Date;
	}[]
> {
	const foundSchedules = await db
		.select({
			predictedStartDate: requests.predictedStartDate,
			predictedEndDate: requests.predictedEndDate,
		})
		.from(requests)
		.where(
			and(
				eq(requests.vehicleId, vehicleId),
				gt(requests.predictedEndDate, new Date()),
			),
		);

	return foundSchedules;
}
export async function fetchRequests(): Promise<Request[]> {
	const foundRequests = await db.select().from(requests);

	return foundRequests;
}

async function acquireScheduleLocks(
	tx: Transaction,
	params: {
		userId: string;
		vehicleId?: string;
	},
) {
	const lockKeys = [`driver-schedule:${params.userId}`];

	if (params.vehicleId) {
		lockKeys.push(`vehicle-schedule:${params.vehicleId}`);
	}

	for (const lockKey of [...new Set(lockKeys)].sort()) {
		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
		);
	}
}

async function findRequestByIdInTransaction(
	tx: Transaction,
	id: string,
): Promise<Request | undefined> {
	const [request] = await tx
		.select()
		.from(requests)
		.where(eq(requests.id, id))
		.limit(1);

	return request;
}

async function findVehicleScheduleConflictInTransaction(
	tx: Transaction,
	params: {
		vehicleId: string;
		predictedStartDate: Date;
		predictedEndDate: Date;
		ignoredRequestId?: string;
	},
) {
	const [request] = await tx
		.select({ id: requests.id })
		.from(requests)
		.leftJoin(routes, eq(routes.requestId, requests.id))
		.where(
			and(
				eq(requests.vehicleId, params.vehicleId),
				params.ignoredRequestId
					? ne(requests.id, params.ignoredRequestId)
					: undefined,
				or(
					and(
						inArray(requests.status, [
							REQUEST_STATUS.PENDING,
							REQUEST_STATUS.APPROVED,
						]),
						lt(requests.predictedStartDate, params.predictedEndDate),
						gt(requests.predictedEndDate, params.predictedStartDate),
					),
					and(
						eq(requests.status, REQUEST_STATUS.COMPLETED),
						eq(routes.status, ROUTE_STATUS.FINISHED),
						isNotNull(routes.startedAt),
						isNotNull(routes.finishedAt),
						lt(routes.startedAt, params.predictedEndDate),
						gt(routes.finishedAt, params.predictedStartDate),
					),
				),
			),
		)
		.limit(1);

	return request;
}

async function findDriverScheduleConflictInTransaction(
	tx: Transaction,
	params: {
		userId: string;
		predictedStartDate: Date;
		predictedEndDate: Date;
		ignoredRequestId?: string;
	},
) {
	const [request] = await tx
		.select({ id: requests.id })
		.from(requests)
		.leftJoin(routes, eq(routes.requestId, requests.id))
		.where(
			and(
				eq(requests.userId, params.userId),
				params.ignoredRequestId
					? ne(requests.id, params.ignoredRequestId)
					: undefined,
				or(
					and(
						inArray(requests.status, [
							REQUEST_STATUS.PENDING,
							REQUEST_STATUS.APPROVED,
						]),
						lt(requests.predictedStartDate, params.predictedEndDate),
						gt(requests.predictedEndDate, params.predictedStartDate),
					),
					and(
						eq(requests.status, REQUEST_STATUS.COMPLETED),
						eq(routes.status, ROUTE_STATUS.FINISHED),
						isNotNull(routes.startedAt),
						isNotNull(routes.finishedAt),
						lt(routes.startedAt, params.predictedEndDate),
						gt(routes.finishedAt, params.predictedStartDate),
					),
				),
			),
		)
		.limit(1);

	return request;
}
