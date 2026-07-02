import { eq } from "drizzle-orm";
import { vehicles } from "@/domains/vehicles/schema";
import { VEHICLE_STATUS } from "@/domains/vehicles/status";
import { db } from "@/drizzle/client";

export type Vehicle = typeof vehicles.$inferSelect;

export async function fetchAll(): Promise<Vehicle[]> {
	const foundVehicles = await db.select().from(vehicles);

	return foundVehicles;
}

export async function fetchAllAvailable(): Promise<Vehicle[]> {
	const foundVehicles = await db
		.select()
		.from(vehicles)
		.where(eq(vehicles.status, VEHICLE_STATUS.AVAILABLE));

	return foundVehicles;
}

export async function findByPlate(plate: string): Promise<Vehicle | undefined> {
	const [vehicle] = await db
		.select()
		.from(vehicles)
		.where(eq(vehicles.plate, plate))
		.limit(1);

	return vehicle;
}

export async function findById(id: string): Promise<Vehicle | undefined> {
	const [vehicle] = await db
		.select()
		.from(vehicles)
		.where(eq(vehicles.id, id))
		.limit(1);

	return vehicle;
}

export async function insertVehicle(
	data: typeof vehicles.$inferInsert,
): Promise<Vehicle> {
	const [vehicle] = await db.insert(vehicles).values(data).returning();
	return vehicle;
}

export async function updateVehicle(
	id: string,
	data: typeof vehicles.$inferInsert,
): Promise<Vehicle | undefined> {
	const [vehicle] = await db
		.update(vehicles)
		.set(data)
		.where(eq(vehicles.id, id))
		.returning();

	return vehicle;
}

export async function deleteVehicle(id: string): Promise<Vehicle | undefined> {
	const [vehicle] = await db
		.delete(vehicles)
		.where(eq(vehicles.id, id))
		.returning();

	return vehicle;
}
