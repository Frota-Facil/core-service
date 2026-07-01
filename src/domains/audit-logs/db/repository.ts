import { count, desc, inArray } from "drizzle-orm";
import type { AuditAction } from "@/domains/audit-logs/actions";
import { auditLogs } from "@/domains/audit-logs/schema";
import { db } from "@/drizzle/client";

export type AuditLog = typeof auditLogs.$inferSelect;

type FetchAuditLogsParams = {
	page: number;
	perPage: number;
	auditActions?: AuditAction[];
};

export async function fetchAuditLogs(params: FetchAuditLogsParams): Promise<{
	data: AuditLog[];
	total: number;
}> {
	const where =
		params.auditActions && params.auditActions.length > 0
			? inArray(auditLogs.action, params.auditActions)
			: undefined;

	const [data, totalResult] = await Promise.all([
		db
			.select()
			.from(auditLogs)
			.where(where)
			.orderBy(desc(auditLogs.createdAt))
			.limit(params.perPage)
			.offset((params.page - 1) * params.perPage),
		db.select({ value: count() }).from(auditLogs).where(where),
	]);

	return {
		data,
		total: totalResult[0]?.value ?? 0,
	};
}
