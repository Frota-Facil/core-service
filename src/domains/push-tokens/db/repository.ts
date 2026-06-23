import {
	pushTokens,
	type PushToken,
	type PushTokenPlatform,
} from "@/domains/push-tokens/schema";
import { db } from "@/drizzle/client";
import { eq } from "drizzle-orm";

type CreateOrUpdatePushTokenParams = {
	userId: string;
	token: string;
	platform: PushTokenPlatform;
};

export async function createOrUpdatePushToken({
	userId,
	token,
	platform,
}: CreateOrUpdatePushTokenParams): Promise<PushToken> {
	const [pushToken] = await db
		.insert(pushTokens)
		.values({
			userId,
			token,
			platform,
		})
		.onConflictDoUpdate({
			target: pushTokens.token,
			set: {
				userId,
				platform,
				updatedAt: new Date(),
			},
		})
		.returning();

	return pushToken;
}

export async function fetchPushTokensByUserId(
	userId: string,
): Promise<PushToken[]> {
	return db
		.select()
		.from(pushTokens)
		.where(eq(pushTokens.userId, userId));
}
