import { desc, eq } from "drizzle-orm";
import { tracks } from "@/domains/tracks/schema";
import { db } from "@/drizzle/client";

export type Track = typeof tracks.$inferSelect;

export async function insertTrack(
	data: typeof tracks.$inferInsert,
): Promise<Track> {
	const [track] = await db.insert(tracks).values(data).returning();

	return track;
}

export async function updateTrackImageById(
	id: string,
	data: Pick<typeof tracks.$inferInsert, "imageKey" | "imageUrl">,
): Promise<Track | undefined> {
	const [track] = await db
		.update(tracks)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(tracks.id, id))
		.returning();

	return track;
}

export async function findTracksByRouteId(routeId: string): Promise<Track[]> {
	return db
		.select()
		.from(tracks)
		.where(eq(tracks.routeId, routeId))
		.orderBy(desc(tracks.capturedAt));
}
