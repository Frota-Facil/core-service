export const ROUTES_STATUSES = ["READY", "STATED", "FINISHED"] as const;
export type routeStatuses = (typeof ROUTES_STATUSES)[number];