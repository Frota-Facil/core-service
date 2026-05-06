import { pgTable, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const tracks = pgTable("tracks", {
	id: uuid("id").primaryKey().defaultRandom(),

	routeId: uuid("route_id").notNull(),

	xCoordinate: integer("x_coordinate").notNull(),

	yCoordinate: integer("y_coordinate").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});