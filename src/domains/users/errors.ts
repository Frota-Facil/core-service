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
