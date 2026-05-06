export const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] as const;
export type requestStatueses = (typeof REQUEST_STATUSES)[number];