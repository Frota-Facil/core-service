import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import { approveRequestWithScheduleChecks } from "@/domains/requests/db/repository";
import {
	DriverScheduleConflictError,
	RequestIsNotPendingError,
	RequestNotFoundError,
	VehicleAlreadyScheduledError,
} from "@/domains/requests/errors";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { notifyDriverAboutRequestApproved } from "@/use-cases/notification-service";
import { createRequestApprovedNotificationUseCase } from "@/use-cases/notifications/create-request-notification";
import { sendPushNotificationToUser } from "@/use-cases/push-notification-service";

export async function approveRequestUseCase(
	requestId: string,
	approvedBy: string,
): Promise<RequestResponseDTO> {
	const result = await approveRequestWithScheduleChecks(requestId, approvedBy);

	if (result.status === "not_found") {
		throw new RequestNotFoundError();
	}

	if (result.status === "not_pending") {
		throw new RequestIsNotPendingError();
	}

	if (result.status === "conflict") {
		if (result.conflict === "vehicle") {
			throw new VehicleAlreadyScheduledError();
		}

		throw new DriverScheduleConflictError();
	}

	if (result.status !== "approved") {
		throw new RequestNotFoundError();
	}

	const updatedRequest = result.request;

	await createAuditLog({
		action: AUDIT_ACTIONS[7], // REQUEST.APPROVED
		entityId: updatedRequest.id,
		performedBy: approvedBy,
	});

	await createRequestApprovedNotificationUseCase(updatedRequest.id);

	await notifyDriverAboutRequestApproved(updatedRequest.id);

	await sendPushNotificationToUser({
		userId: updatedRequest.userId,
		title: "Solicitação aprovada",
		body: "Sua solicitação de veículo foi aprovada.",
		data: {
			requestId: updatedRequest.id,
			type: "REQUEST_APPROVED",
		},
	});

	return requestResponseSchema.parse(updatedRequest);
}
