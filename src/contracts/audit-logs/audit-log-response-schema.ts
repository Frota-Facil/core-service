import { z } from "zod";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";

export const auditLogResponseSchema = z.object({
	id: z.uuid(),
	entityId: z.uuid().nullish(),
	action: z.enum(AUDIT_ACTIONS),
	performedBy: z.uuid().nullish(),
	createdAt: z.date(),
});

export type AuditLogResponseDTO = z.infer<typeof auditLogResponseSchema>;

export const paginatedAuditLogsResponseSchema = z.object({
	data: auditLogResponseSchema.array(),
	pagination: z.object({
		page: z.number().int().positive(),
		perPage: z.number().int().positive(),
		total: z.number().int().nonnegative(),
		totalPages: z.number().int().nonnegative(),
	}),
});

export type PaginatedAuditLogsResponseDTO = z.infer<
	typeof paginatedAuditLogsResponseSchema
>;
