import {
	type RequestScheduleResponseDTO,
	requestScheduleResponseSchema,
} from "@/contracts/requests/request-schedule-response-schema";
import {
	findActiveOrFutureScheduleByVehicleId,
	findBusyScheduleByVehicleIdAndPeriod,
} from "@/domains/requests/db/repository";
import { InvalidRequestPeriodError } from "@/domains/requests/errors";
import { findById } from "@/domains/vehicles/db/repository";
import { VehicleNotFoundError } from "@/domains/vehicles/errors";

type FetchVehicleScheduleInput = {
	date?: string;
	ignoredRequestId?: string;
};

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function getDayPeriod(date: string) {
	const match = date.match(calendarDatePattern);

	if (!match) {
		throw new InvalidRequestPeriodError();
	}

	const [, yearValue, monthValue, dayValue] = match;
	const year = Number(yearValue);
	const month = Number(monthValue);
	const day = Number(dayValue);
	const periodStartDate = new Date(year, month - 1, day, 0, 0, 0, 0);

	if (
		periodStartDate.getFullYear() !== year ||
		periodStartDate.getMonth() !== month - 1 ||
		periodStartDate.getDate() !== day
	) {
		throw new InvalidRequestPeriodError();
	}

	const periodEndDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

	return { periodEndDate, periodStartDate };
}

export async function fetchVehicleScheduleUseCase(
	vehicleId: string,
	input: FetchVehicleScheduleInput = {},
): Promise<RequestScheduleResponseDTO[]> {
	const vehicle = await findById(vehicleId);

	if (!vehicle) {
		throw new VehicleNotFoundError();
	}

	const foundSchedules = input.date
		? await findBusyScheduleByVehicleIdAndPeriod({
				vehicleId,
				ignoredRequestId: input.ignoredRequestId,
				...getDayPeriod(input.date),
			})
		: await findActiveOrFutureScheduleByVehicleId(vehicleId);

	return foundSchedules.map((schedule) =>
		requestScheduleResponseSchema.parse(schedule),
	);
}
