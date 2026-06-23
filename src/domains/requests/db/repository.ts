import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { requests } from "@/domains/requests/schema";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

export type Request = typeof requests.$inferSelect;

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

export async function insertRequest(
	data: typeof requests.$inferInsert,
): Promise<Request> {
	const [request] = await db.insert(requests).values(data).returning();

	return request;
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
}): Promise<Request | undefined> {
	const [request] = await db
		.select()
		.from(requests)
		.where(
			and(
				eq(requests.vehicleId, params.vehicleId),
				inArray(requests.status, [
					REQUEST_STATUSES[0], // PENDING
					REQUEST_STATUSES[1], // APPROVED
				]),
				lt(requests.predictedStartDate, params.predictedEndDate),
				gt(requests.predictedEndDate, params.predictedStartDate),
			),
		)
		.limit(1);

	return request;
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
		.where(eq(requests.status, REQUEST_STATUSES[0]));

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
