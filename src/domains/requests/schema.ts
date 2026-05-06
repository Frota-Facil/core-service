import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { REQUEST_STATUSES, type requestStatueses } from "@/domains/requests/status";

export const requests = pgTable("requests", {
	id: uuid("id").primaryKey().defaultRandom(),

	userId: uuid("user_id").notNull(),

	vehicleId: uuid("vehicle_id").notNull(),

	approvedBy: uuid("approved_by"),

	status: text("status", {enum: REQUEST_STATUSES})
    .notNull()
    .$type<requestStatueses>()
    .default(REQUEST_STATUSES[0]),

	startDate: timestamp("start_date").notNull(),

	endDate: timestamp("end_date").notNull(),

	reason: text("reason").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});