import createError from "@fastify/error";

export const RequestNotFoundError = createError(
	"RequestNotFoundError",
	"Solicitação não encontrada",
	404,
);

export const VehicleAlreadyScheduledError = createError(
	"VehicleAlreadyScheduledError",
	"Este veículo já possui uma solicitação ou rota neste horário. Escolha outro veículo ou outro horário.",
	400,
);

export const DriverScheduleConflictError = createError(
	"DriverScheduleConflictError",
	"Você já possui uma solicitação ou rota para este horário. Escolha outro horário.",
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

export const RequestCannotBeUpdatedError = createError(
	"RequestCannotBeUpdatedError",
	"Solicitação não pode ser editada",
	400,
);
