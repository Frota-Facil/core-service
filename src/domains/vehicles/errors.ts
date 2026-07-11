import createError from "@fastify/error";

export const PlateAlreadyRegisteredError = createError(
	"PlateAlreadyRegisteredError",
	"A placa desse veículo já foi registrada",
	400,
);

export const VehicleNotFoundError = createError(
	"VehicleNotFoundError",
	"Veículo não encontrado",
	404,
);
export const VehicleNotAvailableError = createError(
	"VehicleNotAvailableError",
	"Este veículo não está disponível para solicitações.",
	400,
);
