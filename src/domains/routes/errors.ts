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

export const RouteIsNotReadyError = createError(
	"RouteIsNotReadyError",
	"A rota não está pronta para ser iniciada",
	400,
);

export const RouteCannotBeStartedYetError = createError(
	"RouteCannotBeStartedYetError",
	"A viagem só pode ser iniciada até 15 minutos antes do horário previsto",
	400,
);

export const RouteIsNotStartedError = createError(
	"RouteIsNotStartedError",
	"A rota ainda não foi iniciada ou já foi finalizada",
	400,
);

export const RouteReportNotFoundError = createError(
	"RouteReportNotFoundError",
	"Relatório da rota ainda não foi gerado",
	404,
);
