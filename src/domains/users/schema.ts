import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { USER_ROLES, type UserRoles } from "@/domains/users/roles";

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		name: text("name").notNull(),

		email: text("email").notNull().unique(),

		cnh: text("cnh").unique(),

		phone: text("phone").notNull(),

		photoUrl: text("photo_url"),

		department: text("department"),

		cpf: text("cpf").notNull().unique(),

		passwordHash: text("password_hash").notNull(),

		role: text("role", { enum: USER_ROLES })
			.notNull()
			.$type<UserRoles>()
			.default(USER_ROLES[0]),

		createdAt: timestamp("created_at").defaultNow().notNull(),

		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		roleIdx: index("users_role_idx").on(table.role),
	}),
);

export type User = typeof users.$inferSelect;
