import bcrypt from "bcryptjs";
import type { AdminLoginDTO } from "@/contracts/users/user-login-schema";
import { findUserAdminByCpf } from "@/domains/users/db/repository";
import { InvalidCredentialsError } from "@/domains/users/errors";
import type { TokenService } from "./token-service";

export async function authenticateAdmin(
	input: AdminLoginDTO,
	tokenService: TokenService,
) {
	const { cpf, password } = input;

	const foundUser = await findUserAdminByCpf(cpf);

	if (!foundUser) throw new InvalidCredentialsError();

	const isPasswordValid = await bcrypt.compare(
		password,
		foundUser.passwordHash,
	);

	if (!isPasswordValid) throw new InvalidCredentialsError();

	const token = tokenService.sign({
		id: foundUser.id,
		role: foundUser.role,
	});

	return {
		token,
		user: {
			id: foundUser.id,
			name: foundUser.name,
			email: foundUser.email,
			photoUrl: foundUser.photoUrl,
			role: foundUser.role,
		},
	};
}
