import {
	type MeResponseDTO,
	meResponseSchema,
} from "@/contracts/users/me-response-schema";
import type { UpdateMeDTO } from "@/contracts/users/update-me-schema";
import { findUserById, updateUserById } from "@/domains/users/db/repository";
import { UserNotFoundError } from "@/domains/users/errors";

export async function updateMeUseCase(
	userId: string,
	input: UpdateMeDTO,
): Promise<MeResponseDTO> {
	const user = await findUserById(userId);

	if (!user) {
		throw new UserNotFoundError();
	}

	const dataToUpdate: UpdateMeDTO = {};

	if (input.name !== undefined) {
		dataToUpdate.name = input.name;
	}

	if (input.phone !== undefined) {
		dataToUpdate.phone = input.phone;
	}

	const updatedUser = await updateUserById(userId, dataToUpdate);

	if (!updatedUser) {
		throw new UserNotFoundError();
	}

	return meResponseSchema.parse(updatedUser);
}
