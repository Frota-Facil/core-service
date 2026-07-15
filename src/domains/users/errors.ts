import createError from "@fastify/error";

export const EmailAlreadyInUseError = createError(
	"EmailAlreadyInUseError",
	"E-mail já está em uso",
	400,
);

export const CpfAlreadyInUseError = createError(
	"CpfAlreadyInUseError",
	"CPF já está em uso",
	400,
);

export const UserNotFoundError = createError(
	"UserNotFoundError",
	"Usuário não encontrado",
	404,
);

export const InvalidCredentialsError = createError(
	"InvalidCredentialsError",
	"Credenciais inválidas",
	401,
);

export const GoogleAuthNotConfiguredError = createError(
	"GoogleAuthNotConfiguredError",
	"Google Sign-In não configurado",
	500,
);

export const InvalidGoogleTokenError = createError(
	"InvalidGoogleTokenError",
	"Token do Google inválido",
	401,
);

export const GoogleTokenVerificationUnavailableError = createError(
	"GoogleTokenVerificationUnavailableError",
	"Não foi possível validar token do Google",
	503,
);
