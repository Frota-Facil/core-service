import type { vehicleRequestDTO } from "@/contracts/vehicles/register-vehicle-request-schema";
import type { vehicleResponseDTO } from "@/contracts/vehicles/vehicle-response-schema";
import { vehicleResponseSchema } from "@/contracts/vehicles/vehicle-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	findById,
	findByPlate,
	updateVehicle as updateVehicleRepository,
} from "@/domains/vehicles/db/repository";
import {
	PlateAlreadyRegisteredError,
	VehicleNotFoundError,
} from "@/domains/vehicles/errors";
import { createAuditLog } from "@/use-cases/audit-log-service";

export async function updateVehicle(
	id: string,
	input: vehicleRequestDTO,
	performedBy?: string,
): Promise<vehicleResponseDTO> {
	const vehicle = await findById(id);

	if (!vehicle) {
		throw VehicleNotFoundError();
	}

	const vehicleWithSamePlate = await findByPlate(input.plate);

	if (vehicleWithSamePlate && vehicleWithSamePlate.id !== id) {
		throw PlateAlreadyRegisteredError();
	}

	const updatedVehicle = await updateVehicleRepository(id, {
		plate: input.plate,
		model: input.model,
		year: input.year,
		odometer: input.odometer,
		imageUrl: input.imageUrl ?? null,
		status: input.status,
		type: input.type,
	});

	if (!updatedVehicle) {
		throw VehicleNotFoundError();
	}

	await createAuditLog({
		action: AUDIT_ACTIONS[4],
		entityId: updatedVehicle.id,
		performedBy,
	});

	return vehicleResponseSchema.parse(updatedVehicle);
}
