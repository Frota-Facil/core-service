import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { findActiveOrFutureRequestsByUserId } from "@/domains/requests/db/repository";
import { findUserById } from "@/domains/users/db/repository";
import { UserNotFoundError } from "@/domains/users/errors";

export async function fetchUserRequestsUseCase(
	userId: string,
): Promise<RequestResponseDTO[]> {
	const user = await findUserById(userId);

	if (!user) {
		throw new UserNotFoundError();
	}

	const foundRequests = await findActiveOrFutureRequestsByUserId(userId);

	return foundRequests.map((request) => requestResponseSchema.parse(request));
}