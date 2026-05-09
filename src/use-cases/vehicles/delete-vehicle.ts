import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";
import {
	deleteVehicle as deleteVehicleRepository,
	findById,
} from "@/domains/vehicles/db/repository";
import { VehicleNotFoundError } from "@/domains/vehicles/errors";
import { createAuditLog } from "@/use-cases/audit-log-service";

export async function deleteVehicle(
	id: string,
	performedBy?: string,
): Promise<void> {
	const vehicle = await findById(id);

	if (!vehicle) {
		throw VehicleNotFoundError();
	}

	const deletedVehicle = await deleteVehicleRepository(id);

	if (!deletedVehicle) {
		throw VehicleNotFoundError();
	}

	await createAuditLog({
		action: AUDIT_ACTIONS[5],
		entityId: deletedVehicle.id,
		performedBy,
	});
}
