import { createNotification } from "@/domains/notifications/db/repository";
import { findRequestById } from "@/domains/requests/db/repository";
import { RequestNotFoundError } from "@/domains/requests/errors";
import { findById as findVehicleById } from "@/domains/vehicles/db/repository";
import { VehicleNotFoundError } from "@/domains/vehicles/errors";

export async function createRequestApprovedNotificationUseCase(
	requestId: string,
) {
	const request = await findRequestById(requestId);

	if (!request) {
		throw new RequestNotFoundError();
	}

	const vehicle = await findVehicleById(request.vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	const notification = await createNotification({
		userId: request.userId,
		requestId: request.id,
		title: "Solicitação aprovada",
		message: `Sua solicitação do veículo ${vehicle.model} foi aprovada.`,
		type: "REQUEST_APPROVED",
	});

	return notification;
}

export async function createRequestRejectedNotificationUseCase(
	requestId: string,
) {
	const request = await findRequestById(requestId);

	if (!request) {
		throw new RequestNotFoundError();
	}

	const vehicle = await findVehicleById(request.vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	const notification = await createNotification({
		userId: request.userId,
		requestId: request.id,
		title: "Solicitação recusada",
		message: `Sua solicitação do veículo ${vehicle.model} foi recusada.`,
		type: "REQUEST_REJECTED",
	});

	return notification;
}
