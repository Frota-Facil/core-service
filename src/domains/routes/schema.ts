import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { requests } from "@/domains/requests/schema";
import { ROUTES_STATUSES, type routeStatuses } from "@/domains/routes/status";

export const routes = pgTable("routes", {
	id: uuid("id").primaryKey().defaultRandom(),

	requestId: uuid("request_id")
		.notNull()
		.references(() => requests.id, {
			onDelete: "cascade",
		}),

	status: text("status", { enum: ROUTES_STATUSES })
		.notNull()
		.$type<routeStatuses>()
		.default(ROUTES_STATUSES[0]),

	description: text("description"),

	startedAt: timestamp("started_at"),

	finishedAt: timestamp("finished_at"),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});
