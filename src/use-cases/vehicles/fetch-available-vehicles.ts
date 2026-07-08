import {
	type vehicleResponseDTO,
	vehicleResponseSchema,
} from "@/contracts/vehicles/vehicle-response-schema";
import { findVehicleScheduleConflict } from "@/domains/requests/db/repository";
import { InvalidRequestPeriodError } from "@/domains/requests/errors";
import {
	fetchAllAvailable,
	fetchAllRequestableForSchedule,
} from "@/domains/vehicles/db/repository";

type FetchAvailableVehiclesInput = {
	ignoredRequestId?: string;
	predictedEndDate?: Date;
	predictedStartDate?: Date;
};

export async function fetchAvailableVehicles(
	input: FetchAvailableVehiclesInput = {},
): Promise<vehicleResponseDTO[]> {
	if (!input.predictedStartDate && !input.predictedEndDate) {
		const foundVehicles = await fetchAllAvailable();

		return foundVehicles.map((vehicle) => vehicleResponseSchema.parse(vehicle));
	}

	if (
		!input.predictedStartDate ||
		!input.predictedEndDate ||
		input.predictedEndDate <= input.predictedStartDate
	) {
		throw new InvalidRequestPeriodError();
	}

	const foundVehicles = await fetchAllRequestableForSchedule();
	const vehiclesWithConflict = await Promise.all(
		foundVehicles.map(async (vehicle) => {
			const conflict = await findVehicleScheduleConflict({
				vehicleId: vehicle.id,
				predictedStartDate: input.predictedStartDate as Date,
				predictedEndDate: input.predictedEndDate as Date,
				ignoredRequestId: input.ignoredRequestId,
			});

			return { conflict, vehicle };
		}),
	);

	const availableVehicles = vehiclesWithConflict
		.filter(({ conflict }) => !conflict)
		.map(({ vehicle }) => vehicle);

	return availableVehicles.map((vehicle) =>
		vehicleResponseSchema.parse(vehicle),
	);
}
