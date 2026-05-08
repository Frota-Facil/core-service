import { eq } from "drizzle-orm";
import { routes } from "@/domains/routes/schema";
import { db } from "@/drizzle/client";

export type Route = typeof routes.$inferSelect;

export async function insertRoute(
	data: typeof routes.$inferInsert,
): Promise<Route> {
	const [route] = await db.insert(routes).values(data).returning();

	return route;
}

export async function findRouteById(id: string): Promise<Route | undefined> {
	const [route] = await db
		.select()
		.from(routes)
		.where(eq(routes.id, id))
		.limit(1);

	return route;
}

export async function findRouteByRequestId(
	requestId: string,
): Promise<Route | undefined> {
	const [route] = await db
		.select()
		.from(routes)
		.where(eq(routes.requestId, requestId))
		.limit(1);

	return route;
}

export async function updateRouteById(
	id: string,
	data: Partial<typeof routes.$inferInsert>,
): Promise<Route | undefined> {
	const [route] = await db
		.update(routes)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(routes.id, id))
		.returning();

	return route;
}