import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
	REQUEST_STATUSES,
	type requestStatuses,
} from "@/domains/requests/status";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";

export const requests = pgTable("requests", {
	id: uuid("id").primaryKey().defaultRandom(),

	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),

	vehicleId: uuid("vehicle_id")
		.notNull()
		.references(() => vehicles.id, {
			onDelete: "cascade",
		}),

	approvedBy: uuid("approved_by").references(() => users.id, {
		onDelete: "set null",
	}),

	status: text("status", { enum: REQUEST_STATUSES })
		.notNull()
		.$type<requestStatuses>()
		.default(REQUEST_STATUSES[0]),

	predictedStartDate: timestamp("predicted_start_date").notNull(),

	predictedEndDate: timestamp("predicted_end_date").notNull(),

	destination: text("destination").notNull(),

	reason: text("reason").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});
