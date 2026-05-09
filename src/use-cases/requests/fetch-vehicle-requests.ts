import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { findRequestsByVehicleId } from "@/domains/requests/db/repository";
import { findById } from "@/domains/vehicles/db/repository";
import { VehicleNotFoundError } from "@/domains/vehicles/errors";

export async function fetchVehicleRequestsUseCase(
	vehicleId: string,
): Promise<RequestResponseDTO[]> {
	const vehicle = await findById(vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	const foundRequests = await findRequestsByVehicleId(vehicleId);

	return foundRequests.map((request) => requestResponseSchema.parse(request));
}