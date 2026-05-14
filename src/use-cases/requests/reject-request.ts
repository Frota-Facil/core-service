import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import {
	findRequestById,
	updateRequestById,
} from "@/domains/requests/db/repository";
import {
	RequestIsNotPendingError,
	RequestNotFoundError,
} from "@/domains/requests/errors";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import { createAuditLog } from "@/use-cases/audit-log-service";

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


	// Buscar email do user desse request
	// Buscar nome do veículo desse request
	
	// Dar o push na fila de mensagens para enviar email de notificação para o user
	
	await createAuditLog({
	action: AUDIT_ACTIONS[8], // REQUEST.REJECTED
	entityId: updatedRequest.id,
	performedBy,
    });

	return requestResponseSchema.parse(updatedRequest);
}
