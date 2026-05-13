import {
	type RequestResponseDTO,
	requestResponseSchema,
} from "@/contracts/requests/request-response-schema";
import { fetchRequests } from "@/domains/requests/db/repository";

export async function fetchRequestsUseCase(): Promise<RequestResponseDTO[]> {
	const requests = await fetchRequests();

	return requests.map((request) => requestResponseSchema.parse(request));
}