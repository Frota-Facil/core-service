import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { USER_ROLES, type UserRoles } from "@/domains/users/roles";

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		name: text("name").notNull(),

		email: text("email").notNull().unique(),

		cpf: text("cpf").notNull().unique(),

		passwordHash: text("password_hash").notNull(),

		role: text("role", { enum: USER_ROLES })
			.notNull()
			.$type<UserRoles>()
			.default(USER_ROLES[0]),

		createdAt: integer("created_at", { mode: "timestamp" })
			.$defaultFn(() => new Date())
			.notNull(),

		updatedAt: integer("updated_at", { mode: "timestamp" })
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => ({
		roleIdx: index("users_role_idx").on(table.role),
	}),
);
