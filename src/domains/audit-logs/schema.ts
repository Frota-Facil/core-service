import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { AUDIT_ACTIONS, type AuditAction } from "@/domains/audit-logs/actions";

export const auditLogs = pgTable("audit_logs", {
	id: uuid("id").defaultRandom().primaryKey(),

	entityId: uuid("entity_id"),

	action: text("action", { enum: AUDIT_ACTIONS })
		.notNull()
		.$type<AuditAction>(),

	performedBy: uuid("performed_by").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});
