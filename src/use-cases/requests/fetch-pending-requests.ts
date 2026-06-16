import {
	type RequestWithRelationsResponseDTO,
	requestWithRelationsResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { findPendingRequests } from "@/domains/requests/db/repository";

export async function fetchPendingRequestsUseCase(): Promise<
	RequestWithRelationsResponseDTO[]
> {
	const requests = await findPendingRequests();

	return requests.map((request) =>
		requestWithRelationsResponseSchema.parse(request),
	);
}
