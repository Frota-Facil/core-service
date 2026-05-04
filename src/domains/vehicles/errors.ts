import createError from "@fastify/error";

export const PlateAlreadyRegisteredError = createError(
	"PlateAlreadyRegisteredError",
	"A placa desse veículo já foi registrada",
	400,
);
