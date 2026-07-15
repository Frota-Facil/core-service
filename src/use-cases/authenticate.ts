import bcrypt from "bcryptjs";
import type { UserLoginDTO } from "@/contracts/users/user-login-schema";
import { findUserByEmailAndRole } from "@/domains/users/db/repository";
import { InvalidCredentialsError } from "@/domains/users/errors";
import { USER_ROLES } from "@/domains/users/roles";
import { createAuthResponse } from "@/use-cases/auth-response";
import type { TokenService } from "./token-service";

export async function authenticate(
	input: UserLoginDTO,
	tokenService: TokenService,
) {
	const { email, password } = input;

	const foundUser = await findUserByEmailAndRole(email, USER_ROLES[0]);

	if (!foundUser) throw new InvalidCredentialsError();

	const isPasswordValid = await bcrypt.compare(
		password,
		foundUser.passwordHash,
	);

	if (!isPasswordValid) throw new InvalidCredentialsError();

	return createAuthResponse(foundUser, tokenService);
}
