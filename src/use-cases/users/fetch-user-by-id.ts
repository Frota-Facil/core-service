import {
	type UserResponseDTO,
	userResponseSchema,
} from "@/contracts/users/user-response-schema";
import { findUserById } from "@/domains/users/db/repository";
import { UserNotFoundError } from "@/domains/users/errors";

export async function fetchUserByIdUseCase(
	id: string,
): Promise<UserResponseDTO> {
	const user = await findUserById(id);

	if (!user) {
		throw new UserNotFoundError();
	}

	return userResponseSchema.parse(user);
}