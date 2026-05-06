export const REQUEST_STATUSES = [
	"PENDING",
	"APPROVED",
	"REJECTED",
	"COMPLETED",
] as const;
export type requestStatuses = (typeof REQUEST_STATUSES)[number];
