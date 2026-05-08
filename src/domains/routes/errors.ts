import createError from "@fastify/error";

export const RouteNotFoundError = createError(
	"RouteNotFoundError",
	"Rota não encontrada",
	404,
);

export const RouteAlreadyStartedError = createError(
	"RouteAlreadyStartedError",
	"Essa solicitação já possui uma rota iniciada",
	400,
);

export const RouteIsNotStartedError = createError(
	"RouteIsNotStartedError",
	"A rota ainda não foi iniciada ou já foi finalizada",
	400,
);