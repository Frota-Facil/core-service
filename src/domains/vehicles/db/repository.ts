import { eq } from "drizzle-orm";
import { vehicles } from "@/domains/vehicles/schema";
import { VEHICLE_STATUSES } from "@/domains/vehicles/status";
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
		.where(eq(vehicles.status, VEHICLE_STATUSES[0]));

	return foundVehicles;
}
