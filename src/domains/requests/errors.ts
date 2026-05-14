import createError from "@fastify/error";

export const RequestNotFoundError = createError(
	"RequestNotFoundError",
	"Solicitação não encontrada",
	404,
);

export const VehicleAlreadyScheduledError = createError(
	"VehicleAlreadyScheduledError",
	"Veículo já está agendado para esse período",
	400,
);

export const InvalidRequestPeriodError = createError(
	"InvalidRequestPeriodError",
	"A data final deve ser maior que a data inicial",
	400,
);

export const RequestIsNotPendingError = createError(
	"RequestIsNotPendingError",
	"A solicitação não está pendente",
	400,
);

export const RequestIsNotApprovedError = createError(
	"RequestIsNotApprovedError",
	"A solicitação ainda não foi aprovada",
	400,
);