import type { vehicleRequestDTO } from "@/contracts/vehicles/register-vehicle-request-schema";
import type { vehicleResponseDTO } from "@/contracts/vehicles/vehicle-response-schema";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import { findByPlate, insertVehicle } from "@/domains/vehicles/db/repository";
import { PlateAlreadyRegisteredError } from "@/domains/vehicles/errors";
import { createAuditLog } from "@/use-cases/audit-log-service";

export async function registerVehicle(
	input: vehicleRequestDTO,
	performedBy?: string,
): Promise<vehicleResponseDTO> {
	const existingPlate = await findByPlate(input.plate);

	if (existingPlate) throw PlateAlreadyRegisteredError();

	const vehicle = await insertVehicle({
		plate: input.plate,
		model: input.model,
		year: input.year,
		odometer: input.odometer,
		imageUrl: input.imageUrl ?? null,
		status: input.status,
		type: input.type,
	});

	await createAuditLog({
		action: AUDIT_ACTIONS[3],
		entityId: vehicle.id,
		performedBy,
	});

	return vehicle;
}
