export const VEHICLE_TYPES = [
	"CAR",
	"MOTORCYCLE",
	"TRUCK",
	"TRACTOR",
	"VAN",
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];
