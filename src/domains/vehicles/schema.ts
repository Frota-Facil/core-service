import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
	VEHICLE_STATUS,
	VEHICLE_STATUSES,
	type vehicleStatuses,
} from "@/domains/vehicles/status";
import {
	VEHICLE_TYPES,
	type VehicleType,
} from "@/domains/vehicles/vehicleType";

export const vehicles = pgTable("vehicles", {
	id: uuid("id").primaryKey().defaultRandom(),

	plate: text("plate").notNull().unique(),

	model: text("model").notNull(),

	year: integer("year").notNull(),

	odometer: integer("odometer").notNull().default(0),

	imageUrl: text("image_url"),

	status: text("status", { enum: VEHICLE_STATUSES })
		.notNull()
		.$type<vehicleStatuses>()
		.default(VEHICLE_STATUS.AVAILABLE),

	type: text("type", { enum: VEHICLE_TYPES })
		.notNull()
		.$type<VehicleType>()
		.default(VEHICLE_TYPES[0]),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});
