import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ROUTES_STATUSES, type routeStatuses } from "@/domains/route/status"

export const routes = pgTable("routes", {
	id: uuid("id").primaryKey().defaultRandom(),

	requestId: uuid("request_id").notNull(),

	status: text("status", {enum: ROUTES_STATUSES})
    .notNull()
    .$type<routeStatuses>()
    .default(ROUTES_STATUSES[0]),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});