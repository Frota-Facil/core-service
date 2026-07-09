import {
	doublePrecision,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { routes } from "@/domains/routes/schema";

export const tracks = pgTable("tracks", {
	id: uuid("id").primaryKey().defaultRandom(),

	routeId: uuid("route_id")
		.notNull()
		.references(() => routes.id, {
			onDelete: "cascade",
		}),

	latitude: doublePrecision("latitude").notNull(),

	longitude: doublePrecision("longitude").notNull(),

	capturedAt: timestamp("captured_at").defaultNow().notNull(),

	imageUrl: text("image_url"),

	imageKey: text("image_key"),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});
