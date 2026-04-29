import {
	type vehicleResponseDTO,
	vehicleResponseSchema,
} from "@/contracts/vehicles/vehicle-response-schema";
import { fetchAllAvailable } from "@/domains/vehicles/db/repository";

export async function fetchAvailableVehicles(): Promise<vehicleResponseDTO[]> {
	const foundVehicles = await fetchAllAvailable();

	return foundVehicles.map((vehicle) => vehicleResponseSchema.parse(vehicle));
}
