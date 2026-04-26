import type { AuditAction } from "@/domains/audit-logs/actions";
import { auditLogs } from "@/domains/audit-logs/schema";
import { db } from "@/drizzle/client";

type CreateAuditLogDTO = {
	entityId?: string;
	action: AuditAction;
	performedBy?: string;
};

export async function createAuditLog(data: CreateAuditLogDTO) {
	await db.insert(auditLogs).values({
		entityId: data.entityId,
		action: data.action,
		performedBy: data.performedBy,
	});
}
