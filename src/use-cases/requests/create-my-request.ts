import type { CreateMyRequestDTO } from "@/contracts/requests/create-my-request-schema";
import {
	type MyRequestResponseDTO,
	myRequestResponseSchema,
} from "@/contracts/requests/my-request-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import { insertRequestWithScheduleChecks } from "@/domains/requests/db/repository";
import {
	DriverScheduleConflictError,
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
import { isVehicleRequestableForSchedule } from "@/domains/vehicles/status";
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

	if (!isVehicleRequestableForSchedule(vehicle.status)) {
		throw new VehicleNotAvailableError();
	}

	const result = await insertRequestWithScheduleChecks({
		userId,
		vehicleId: input.vehicleId,
		status: REQUEST_STATUS.PENDING,
		predictedStartDate: input.predictedStartDate,
		predictedEndDate: input.predictedEndDate,
		destination: input.destination,
		reason: input.reason,
	});

	if (result.conflict === "vehicle") {
		throw new VehicleAlreadyScheduledError();
	}

	if (result.conflict === "driver") {
		throw new DriverScheduleConflictError();
	}

	if (!result.request) {
		throw new DriverScheduleConflictError();
	}

	await createAuditLog({
		action: AUDIT_ACTIONS[6],
		entityId: result.request.id,
		performedBy: userId,
	});

	await notifyAdminsAboutNewRequest(result.request.id);

	return myRequestResponseSchema.parse({
		...result.request,
		vehicle,
	});
}
