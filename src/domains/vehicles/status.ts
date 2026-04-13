export const VEHICLE_STATUSES = ["AVAILABLE", "IN_USE", "MAINTENANCE"] as const;
export type vehicleStatuses = (typeof VEHICLE_STATUSES)[number];
