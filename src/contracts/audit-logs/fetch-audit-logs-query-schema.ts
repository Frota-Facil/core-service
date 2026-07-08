import { z } from "zod";
import { AUDIT_ACTIONS } from "@/domains/audit-logs/actions";

export const fetchAuditLogsQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	perPage: z.coerce.number().int().positive().max(100).default(20),
	audit_actions: z
		.preprocess((value) => {
			if (typeof value === "string") {
				return value.split(",");
			}

			return value;
		}, z.enum(AUDIT_ACTIONS).array())
		.optional(),
});

export type FetchAuditLogsQueryDTO = z.infer<typeof fetchAuditLogsQuerySchema>;
