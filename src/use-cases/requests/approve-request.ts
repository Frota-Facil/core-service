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
import { notifyDriverAboutRequestApproved } from "@/use-cases/notification-service";

export async function approveRequestUseCase(
	requestId: string,
	approvedBy: string,
): Promise<RequestResponseDTO> {
	const request = await findRequestById(requestId);

	if (!request) {
		throw new RequestNotFoundError();
	}

	if (request.status !== REQUEST_STATUSES[0]) {
		throw new RequestIsNotPendingError();
	}

	const updatedRequest = await updateRequestById(requestId, {
		status: REQUEST_STATUSES[1], // APPROVED
		approvedBy,
	});

	if (!updatedRequest) {
		throw new RequestNotFoundError();
	}
	await createAuditLog({
		action: AUDIT_ACTIONS[7], // REQUEST.APPROVED
		entityId: updatedRequest.id,
		performedBy: approvedBy,
	});

	await notifyDriverAboutRequestApproved(updatedRequest.id);

	return requestResponseSchema.parse(updatedRequest);
}
