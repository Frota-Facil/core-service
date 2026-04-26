import bcrypt from "bcryptjs";
import type { CreateUserDTO } from "@/contracts/users/create-user-schema";
import type { UserResponseDTO } from "@/contracts/users/user-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	findUserByCpf,
	findUserByEmail,
	insertUser,
} from "@/domains/users/db/repository";
import {
	CpfAlreadyInUseError,
	EmailAlreadyInUseError,
} from "@/domains/users/errors";
import { createAuditLog } from "@/use-cases/audit-log-service";

export async function createUserUseCase(
	input: CreateUserDTO,
	performedBy?: string,
): Promise<UserResponseDTO> {
	const [existingEmail, existingCpf] = await Promise.all([
		findUserByEmail(input.email),
		findUserByCpf(input.cpf),
	]);

	if (existingEmail) throw new EmailAlreadyInUseError();
	if (existingCpf) throw new CpfAlreadyInUseError();

	const passwordHash = await bcrypt.hash(input.password, 10);

	const { passwordHash: _, ...user } = await insertUser({
		name: input.name,
		email: input.email,
		cpf: input.cpf,
		role: input.role,
		passwordHash,
	});

	await createAuditLog({
		action: AUDIT_ACTIONS[0],
		entityId: user.id,
		performedBy,
	});

	return user;
}
