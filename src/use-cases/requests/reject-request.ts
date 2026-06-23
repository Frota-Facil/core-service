import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	findRequestById,
	updateRequestById,
} from "@/domains/requests/db/repository";
import {
	RequestIsNotPendingError,
	RequestNotFoundError,
} from "@/domains/requests/errors";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { notifyDriverAboutRequestRejected } from "@/use-cases/notification-service";
import { createRequestRejectedNotificationUseCase } from "@/use-cases/notifications/create-request-notification";
import { sendPushNotificationToUser } from "@/use-cases/push-notification-service";

export async function rejectRequestUseCase(
	requestId: string,
	performedBy?: string,
): Promise<RequestResponseDTO> {
	const request = await findRequestById(requestId);

	if (!request) {
		throw new RequestNotFoundError();
	}

	if (request.status !== REQUEST_STATUSES[0]) {
		throw new RequestIsNotPendingError();
	}

	const updatedRequest = await updateRequestById(requestId, {
		status: REQUEST_STATUSES[2], // REJECTED
	});

	if (!updatedRequest) {
		throw new RequestNotFoundError();
	}

	await createAuditLog({
		action: AUDIT_ACTIONS[8], // REQUEST.REJECTED
		entityId: updatedRequest.id,
		performedBy,
	});
	await createRequestRejectedNotificationUseCase(updatedRequest.id);

	await notifyDriverAboutRequestRejected(updatedRequest.id);

	await sendPushNotificationToUser({
		userId: request.userId,
		title: "Solicitação recusada",
		body: "Sua solicitação de veículo foi recusada.",
		data: {
			requestId: updatedRequest.id,
			type: "REQUEST_REJECTED",
		},
	});

	return requestResponseSchema.parse(updatedRequest);
}
