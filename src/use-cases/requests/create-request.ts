import type { CreateRequestDTO } from "@/contracts/requests/create-request-schema";
import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
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

export async function createRequestUseCase(
	input: CreateRequestDTO,
	performedBy?: string,
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

	if (!isVehicleRequestableForSchedule(vehicle.status)) {
		throw new VehicleNotAvailableError();
	}

	const result = await insertRequestWithScheduleChecks({
		userId: input.userId,
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

	// Buscar lista de emails dos admins
	// Buscar nome do user e nome do veículo

	// Dar o push na fila de mensagens para enviar email de notificação para os admins

	await createAuditLog({
		action: AUDIT_ACTIONS[6], // REQUEST.CREATED
		entityId: result.request.id,
		performedBy,
	});

	await notifyAdminsAboutNewRequest(result.request.id);

	return requestResponseSchema.parse(result.request);
}
