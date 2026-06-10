export const NOTIFICATION_TYPES = [
	"REQUEST_APPROVED",
	"REQUEST_REJECTED",
	"REQUEST_CREATED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
