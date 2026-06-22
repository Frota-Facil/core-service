import {
	type MeResponseDTO,
	meResponseSchema,
} from "@/contracts/users/me-response-schema";
import { findUserById } from "@/domains/users/db/repository";
import { UserNotFoundError } from "@/domains/users/errors";

export async function getMeUseCase(userId: string): Promise<MeResponseDTO> {
	const user = await findUserById(userId);

	if (!user) {
		throw new UserNotFoundError();
	}

	return meResponseSchema.parse(user);
}
