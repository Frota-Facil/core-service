import {
	type vehicleResponseDTO,
	vehicleResponseSchema,
} from "@/contracts/vehicles/vehicle-response-schema";
import { fetchAll } from "@/domains/vehicles/db/repository";

export async function fetchVehicles(): Promise<vehicleResponseDTO[]> {
	const foundVehicles = await fetchAll();

	return foundVehicles.map((vehicle) => vehicleResponseSchema.parse(vehicle));
}
