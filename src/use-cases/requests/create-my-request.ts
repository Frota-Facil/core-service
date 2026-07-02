import type { CreateMyRequestDTO } from "@/contracts/requests/create-my-request-schema";
import {
	type MyRequestResponseDTO,
	myRequestResponseSchema,
} from "@/contracts/requests/my-request-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	findVehicleScheduleConflict,
	insertRequest,
} from "@/domains/requests/db/repository";
import {
	InvalidRequestPeriodError,
	VehicleAlreadyScheduledError,
} from "@/domains/requests/errors";
import { REQUEST_STATUS } from "@/domains/requests/status";
import { findUserById } from "@/domains/users/db/repository";
import { UserNotFoundError } from "@/domains/users/errors";
import { findById } from "@/domains/vehicles/db/repository";
import {
	VehicleNotAvailableError,
	VehicleNotFoundError,
} from "@/domains/vehicles/errors";
import { VEHICLE_STATUS } from "@/domains/vehicles/status";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { notifyAdminsAboutNewRequest } from "@/use-cases/notification-service";

export async function createMyRequestUseCase(
	userId: string,
	input: CreateMyRequestDTO,
): Promise<MyRequestResponseDTO> {
	if (input.predictedEndDate <= input.predictedStartDate) {
		throw new InvalidRequestPeriodError();
	}

	const user = await findUserById(userId);

	if (!user) {
		throw new UserNotFoundError();
	}

	const vehicle = await findById(input.vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
		throw new VehicleNotAvailableError();
	}

	const conflict = await findVehicleScheduleConflict({
		vehicleId: input.vehicleId,
		predictedStartDate: input.predictedStartDate,
		predictedEndDate: input.predictedEndDate,
	});

	if (conflict) {
		throw new VehicleAlreadyScheduledError();
	}

	const createdRequest = await insertRequest({
		userId,
		vehicleId: input.vehicleId,
		status: REQUEST_STATUS.PENDING,
		predictedStartDate: input.predictedStartDate,
		predictedEndDate: input.predictedEndDate,
		destination: input.destination,
		reason: input.reason,
	});

	await createAuditLog({
		action: AUDIT_ACTIONS[6],
		entityId: createdRequest.id,
		performedBy: userId,
	});

	await notifyAdminsAboutNewRequest(createdRequest.id);

	return myRequestResponseSchema.parse({
		...createdRequest,
		vehicle,
	});
}
