import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/domains/users/schema";

export const PUSH_TOKEN_PLATFORMS = ["android", "ios"] as const;

export type PushTokenPlatform = (typeof PUSH_TOKEN_PLATFORMS)[number];

export const pushTokens = pgTable("push_tokens", {
	id: uuid("id").primaryKey().defaultRandom(),

	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),

	token: text("token").notNull().unique(),

	platform: text("platform", { enum: PUSH_TOKEN_PLATFORMS })
		.notNull()
		.$type<PushTokenPlatform>(),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;
