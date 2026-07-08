import {
	type MyRequestResponseDTO,
	myRequestResponseSchema,
} from "@/contracts/requests/my-request-response-schema";
import { findRequestsByUserIdWithVehicle } from "@/domains/requests/db/repository";

export async function fetchMyRequestsUseCase(
	userId: string,
): Promise<MyRequestResponseDTO[]> {
	const requests = await findRequestsByUserIdWithVehicle(userId);

	return requests.map((request) => myRequestResponseSchema.parse(request));
}
