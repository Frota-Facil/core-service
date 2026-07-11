import {
	type RequestScheduleResponseDTO,
	requestScheduleResponseSchema,
} from "@/contracts/requests/request-schedule-response-schema";
import { findActiveOrFutureScheduleByVehicleId } from "@/domains/requests/db/repository";
import { findById } from "@/domains/vehicles/db/repository";
import { VehicleNotFoundError } from "@/domains/vehicles/errors";

export async function fetchVehicleScheduleUseCase(
	vehicleId: string,
): Promise<RequestScheduleResponseDTO[]> {
	const vehicle = await findById(vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	const foundSchedules = await findActiveOrFutureScheduleByVehicleId(vehicleId);

	return foundSchedules.map((schedule) =>
		requestScheduleResponseSchema.parse(schedule),
	);
}
