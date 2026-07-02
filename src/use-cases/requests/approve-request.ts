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
import { REQUEST_STATUS } from "@/domains/requests/status";
import {
	findRouteByRequestId,
	insertRoute,
} from "@/domains/routes/db/repository";
import { ROUTE_STATUS } from "@/domains/routes/status";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { notifyDriverAboutRequestApproved } from "@/use-cases/notification-service";
import { createRequestApprovedNotificationUseCase } from "@/use-cases/notifications/create-request-notification";
import { sendPushNotificationToUser } from "@/use-cases/push-notification-service";

export async function approveRequestUseCase(
	requestId: string,
	approvedBy: string,
): Promise<RequestResponseDTO> {
	const request = await findRequestById(requestId);

	if (!request) {
		throw new RequestNotFoundError();
	}

	if (request.status !== REQUEST_STATUS.PENDING) {
		throw new RequestIsNotPendingError();
	}

	const updatedRequest = await updateRequestById(requestId, {
		status: REQUEST_STATUS.APPROVED,
		approvedBy,
	});

	if (!updatedRequest) {
		throw new RequestNotFoundError();
	}

	const existingRoute = await findRouteByRequestId(updatedRequest.id);

	if (!existingRoute) {
		await insertRoute({
			requestId: updatedRequest.id,
			status: ROUTE_STATUS.READY,
		});
	}

	await createAuditLog({
		action: AUDIT_ACTIONS[7], // REQUEST.APPROVED
		entityId: updatedRequest.id,
		performedBy: approvedBy,
	});

	await createRequestApprovedNotificationUseCase(updatedRequest.id);

	await notifyDriverAboutRequestApproved(updatedRequest.id);

	await sendPushNotificationToUser({
		userId: request.userId,
		title: "Solicitação aprovada",
		body: "Sua solicitação de veículo foi aprovada.",
		data: {
			requestId: updatedRequest.id,
			type: "REQUEST_APPROVED",
		},
	});

	return requestResponseSchema.parse(updatedRequest);
}
