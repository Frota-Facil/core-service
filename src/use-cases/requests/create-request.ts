import type { CreateRequestDTO } from "@/contracts/requests/create-request-schema";
import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
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
import {
	VehicleNotAvailableError,
	VehicleNotFoundError,
} from "@/domains/vehicles/errors";
import { VEHICLE_STATUSES } from "@/domains/vehicles/status";
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

	if (vehicle.status !== VEHICLE_STATUSES[0]) {
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

	const request = await insertRequest({
		userId: input.userId,
		vehicleId: input.vehicleId,
		status: REQUEST_STATUSES[0], // PENDING
		predictedStartDate: input.predictedStartDate,
		predictedEndDate: input.predictedEndDate,
		reason: input.reason,
	});

	// Buscar lista de emails dos admins
	// Buscar nome do user e nome do veículo

	// Dar o push na fila de mensagens para enviar email de notificação para os admins

	await createAuditLog({
		action: AUDIT_ACTIONS[6], // REQUEST.CREATED
		entityId: request.id,
		performedBy,
	});

	await notifyAdminsAboutNewRequest(request.id);

	return requestResponseSchema.parse(request);
}
