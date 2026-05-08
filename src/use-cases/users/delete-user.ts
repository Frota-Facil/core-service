import { deleteUserById, findUserById } from "@/domains/users/db/repository";
import { UserNotFoundError } from "@/domains/users/errors";

export async function deleteUserUseCase(id: string): Promise<void> {
	const user = await findUserById(id);

	if (!user) {
		throw new UserNotFoundError();
	}

	await deleteUserById(id);
}