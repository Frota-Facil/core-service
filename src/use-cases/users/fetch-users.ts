import {
	type UserResponseDTO,
	userResponseSchema,
} from "@/contracts/users/user-response-schema";
import { fetchUsers } from "@/domains/users/db/repository";

export async function fetchUsersUseCase(): Promise<UserResponseDTO[]> {
	const users = await fetchUsers();

	return users.map((user) => userResponseSchema.parse(user));
}
