import {
	type PaginatedAuditLogsResponseDTO,
	paginatedAuditLogsResponseSchema,
} from "@/contracts/audit-logs/audit-log-response-schema";
import type { FetchAuditLogsQueryDTO } from "@/contracts/audit-logs/fetch-audit-logs-query-schema";
import { fetchAuditLogs } from "@/domains/audit-logs/db/repository";

export async function fetchAuditLogsUseCase(
	params: FetchAuditLogsQueryDTO,
): Promise<PaginatedAuditLogsResponseDTO> {
	const result = await fetchAuditLogs({
		page: params.page,
		perPage: params.perPage,
		auditActions: params.audit_actions,
	});

	return paginatedAuditLogsResponseSchema.parse({
		data: result.data,
		pagination: {
			page: params.page,
			perPage: params.perPage,
			total: result.total,
			totalPages: Math.ceil(result.total / params.perPage),
		},
	});
}
