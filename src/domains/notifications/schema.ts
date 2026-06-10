import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
	NOTIFICATION_TYPES,
	type NotificationType,
} from "@/domains/notifications/types";
import { requests } from "@/domains/requests/schema";
import { users } from "@/domains/users/schema";

export const notifications = pgTable("notifications", {
	id: uuid("id").primaryKey().defaultRandom(),

	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),

	requestId: uuid("request_id").references(() => requests.id, {
		onDelete: "cascade",
	}),

	title: text("title").notNull(),

	message: text("message").notNull(),

	type: text("type", { enum: NOTIFICATION_TYPES })
		.notNull()
		.$type<NotificationType>(),

	read: boolean("read").notNull().default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
