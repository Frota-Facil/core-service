import type { CreateRequestDTO } from "@/contracts/requests/create-request-schema";
import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import {
	findVehicleScheduleConflict,
	insertRequest,
} from "@/domains/requests/db/repository";
import {
	InvalidRequestPeriodError,
	VehicleAlreadyScheduledError,
} from "@/domains/requests/errors";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import { findUserById } from "@/domains/users/db/repository";
import { UserNotFoundError } from "@/domains/users/errors";
import { findById } from "@/domains/vehicles/db/repository";
import { VehicleNotFoundError } from "@/domains/vehicles/errors";

export async function createRequestUseCase(
	input: CreateRequestDTO,
): Promise<RequestResponseDTO> {
	if (input.predictedEndDate <= input.predictedStartDate) {
		throw new InvalidRequestPeriodError();
	}

	const user = await findUserById(input.userId);

	if (!user) {
		throw new UserNotFoundError();
	}

	const vehicle = await findById(input.vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	const conflict = await findVehicleScheduleConflict({
		vehicleId: input.vehicleId,
		predictedStartDate: input.predictedStartDate,
		predictedEndDate: input.predictedEndDate,
	});

	if (conflict) {
		throw new VehicleAlreadyScheduledError();
	}

	const request = await insertRequest({
		userId: input.userId,
		vehicleId: input.vehicleId,
		status: REQUEST_STATUSES[0], // PENDING
		predictedStartDate: input.predictedStartDate,
		predictedEndDate: input.predictedEndDate,
		reason: input.reason,
	});

	return requestResponseSchema.parse(request);
}
