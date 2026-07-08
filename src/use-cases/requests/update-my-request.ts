import {
	type MyRequestResponseDTO,
	myRequestResponseSchema,
} from "@/contracts/requests/my-request-response-schema";
import type { UpdateMyRequestDTO } from "@/contracts/requests/update-my-request-schema";
import {
	findRequestById,
	updateRequestWithScheduleChecks,
} from "@/domains/requests/db/repository";
import {
	DriverScheduleConflictError,
	InvalidRequestPeriodError,
	RequestCannotBeUpdatedError,
	RequestNotFoundError,
	VehicleAlreadyScheduledError,
} from "@/domains/requests/errors";
import { REQUEST_STATUS } from "@/domains/requests/status";
import { findById } from "@/domains/vehicles/db/repository";
import {
	VehicleNotAvailableError,
	VehicleNotFoundError,
} from "@/domains/vehicles/errors";
import { isVehicleRequestableForSchedule } from "@/domains/vehicles/status";

export async function updateMyRequestUseCase(
	userId: string,
	requestId: string,
	input: UpdateMyRequestDTO,
): Promise<MyRequestResponseDTO> {
	const request = await findRequestById(requestId);

	if (!request || request.userId !== userId) {
		throw new RequestNotFoundError();
	}

	if (request.status !== REQUEST_STATUS.PENDING) {
		throw new RequestCannotBeUpdatedError();
	}

	const vehicleId = input.vehicleId ?? request.vehicleId;
	const predictedStartDate =
		input.predictedStartDate ?? request.predictedStartDate;
	const predictedEndDate = input.predictedEndDate ?? request.predictedEndDate;
	const destination = input.destination ?? request.destination;
	const reason = input.reason ?? request.reason;

	if (predictedEndDate <= predictedStartDate) {
		throw new InvalidRequestPeriodError();
	}

	const vehicle = await findById(vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	if (!isVehicleRequestableForSchedule(vehicle.status)) {
		throw new VehicleNotAvailableError();
	}

	const result = await updateRequestWithScheduleChecks(requestId, {
		userId,
		vehicleId,
		predictedStartDate,
		predictedEndDate,
		destination,
		reason,
	});

	if (result.conflict === "vehicle") {
		throw new VehicleAlreadyScheduledError();
	}

	if (result.conflict === "driver") {
		throw new DriverScheduleConflictError();
	}

	if (!result.request) {
		throw new RequestNotFoundError();
	}

	return myRequestResponseSchema.parse({
		...result.request,
		vehicle,
	});
}
