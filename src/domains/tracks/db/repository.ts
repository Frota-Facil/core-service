import { tracks } from "@/domains/tracks/schema";
import { db } from "@/drizzle/client";

export type Track = typeof tracks.$inferSelect;

export async function insertTrack(
	data: typeof tracks.$inferInsert,
): Promise<Track> {
	const [track] = await db.insert(tracks).values(data).returning();

	return track;
}
