import type { GoogleAuthDTO } from "@/contracts/google-auth-schema";
import { findUserByEmail } from "@/domains/users/db/repository";
import {
	GoogleAuthNotConfiguredError,
	InvalidCredentialsError,
	InvalidGoogleTokenError,
} from "@/domains/users/errors";
import type { GoogleIdTokenVerifier } from "@/services/google-id-token-verifier";
import { createAuthResponse } from "@/use-cases/auth-response";
import type { TokenService } from "@/use-cases/token-service";

export async function authenticateWithGoogle(
	input: GoogleAuthDTO,
	tokenService: TokenService,
	googleTokenVerifier: GoogleIdTokenVerifier,
	audiences: string[],
) {
	if (audiences.length === 0) {
		throw new GoogleAuthNotConfiguredError();
	}

	const googlePayload = await googleTokenVerifier.verify(
		input.idToken,
		audiences,
	);

	if (!googlePayload.emailVerified) {
		throw new InvalidGoogleTokenError();
	}

	const foundUser = await findUserByEmail(googlePayload.email);

	if (!foundUser) {
		throw new InvalidCredentialsError();
	}

	return createAuthResponse(foundUser, tokenService);
}
