export const ROUTES_STATUSES = [
	"PENDING",
	"READY",
	"STARTED",
	"FINISHED",
] as const;
export type routeStatuses = (typeof ROUTES_STATUSES)[number];
