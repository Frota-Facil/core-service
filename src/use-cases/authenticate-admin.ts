import bcrypt from "bcryptjs";
import type { UserLoginDTO } from "@/contracts/users/user-login-schema";
import { findUserAdminByCpf } from "@/domains/users/db/repository";
import { InvalidCredentialsError } from "@/domains/users/errors";
import type { TokenService } from "./token-service";

export async function authenticateAdmin(
	input: UserLoginDTO,
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
		cpf: foundUser.cpf,
		role: foundUser.role,
	});

	return token;
}
