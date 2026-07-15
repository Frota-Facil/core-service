import bcrypt from "bcryptjs";
import type { AdminLoginDTO } from "@/contracts/users/user-login-schema";
import { findUserAdminByCpf } from "@/domains/users/db/repository";
import { InvalidCredentialsError } from "@/domains/users/errors";
import { createAuthResponse } from "@/use-cases/auth-response";
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

	return createAuthResponse(foundUser, tokenService);
}
