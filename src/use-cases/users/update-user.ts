import bcrypt from "bcryptjs";
import type { UpdateUserDTO } from "@/contracts/users/update-user-schema";
import {
	type UserResponseDTO,
	userResponseSchema,
} from "@/contracts/users/user-response-schema";
import {
	findUserByCpf,
	findUserByEmail,
	findUserById,
	updateUserById,
} from "@/domains/users/db/repository";
import {
	CpfAlreadyInUseError,
	EmailAlreadyInUseError,
	UserNotFoundError,
} from "@/domains/users/errors";

export async function updateUserUseCase(
	id: string,
	input: UpdateUserDTO,
): Promise<UserResponseDTO> {
	const user = await findUserById(id);

	if (!user) {
		throw new UserNotFoundError();
	}

	if (input.email && input.email !== user.email) {
		const existingEmail = await findUserByEmail(input.email);

		if (existingEmail) {
			throw new EmailAlreadyInUseError();
		}
	}

	if (input.cpf && input.cpf !== user.cpf) {
		const existingCpf = await findUserByCpf(input.cpf);

		if (existingCpf) {
			throw new CpfAlreadyInUseError();
		}
	}

	const dataToUpdate: Record<string, unknown> = {
		name: input.name,
		email: input.email,
		cpf: input.cpf,
		cnh: input.cnh,
		phone: input.phone,
		department: input.department,
		role: input.role,
	};

	if (input.password) {
		dataToUpdate.passwordHash = await bcrypt.hash(input.password, 10);
	}

	const updatedUser = await updateUserById(id, dataToUpdate);

	if (!updatedUser) {
		throw new UserNotFoundError();
	}

	return userResponseSchema.parse(updatedUser);
}
