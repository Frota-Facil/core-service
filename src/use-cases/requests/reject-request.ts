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

export async function rejectRequestUseCase(
	requestId: string,
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

	return requestResponseSchema.parse(updatedRequest);
}