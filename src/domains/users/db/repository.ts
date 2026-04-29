import { and, eq } from "drizzle-orm";
import type { User } from "@/domains/users/schema";
import { users } from "@/domains/users/schema";
import { db } from "@/drizzle/client";
import { USER_ROLES } from "../roles";

export async function findUserByEmail(
	email: string,
): Promise<User | undefined> {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	return user;
}

export async function findUserByCpf(cpf: string): Promise<User | undefined> {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.cpf, cpf))
		.limit(1);

	return user;
}

export async function findUserAdminByCpf(
	cpf: string,
): Promise<User | undefined> {
	const [user] = await db
		.select()
		.from(users)
		.where(and(eq(users.cpf, cpf), eq(users.role, USER_ROLES[1])))
		.limit(1);

	return user;
}

export async function insertUser(
	data: typeof users.$inferInsert,
): Promise<User> {
	const [user] = await db.insert(users).values(data).returning();
	return user;
}

export async function fetchUsers(): Promise<User[]> {
	const foundUsers = await db.select().from(users);

	return foundUsers;
}
