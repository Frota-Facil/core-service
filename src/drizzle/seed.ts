import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { USER_ROLES } from "@/domains/users/roles";
import { users } from "@/domains/users/schema";
import { db } from "@/drizzle/client";

async function seed() {
	const adminEmail = "admin@sif.com";
	const adminCpf = "00000000000";

	const [existing] = await db
		.select()
		.from(users)
		.where(and(eq(users.email, adminEmail), eq(users.cpf, adminCpf)))
		.limit(1);

	if (existing) {
		console.log("Admin já existe");
		return;
	}

	const passwordHash = await bcrypt.hash("123456", 10);

	await db.insert(users).values({
		name: "AdminSIF",
		email: adminEmail,
		cpf: adminCpf,
		passwordHash: passwordHash,
		role: USER_ROLES[1],
	});

	console.log("Admin criado com sucesso");
}

seed();
