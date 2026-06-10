import { and, desc, eq } from "drizzle-orm";
import {
	type NewNotification,
	notifications,
} from "@/domains/notifications/schema";
import { db } from "@/drizzle/client";

export async function createNotification(data: NewNotification) {
	const [notification] = await db
		.insert(notifications)
		.values(data)
		.returning();

	return notification;
}

export async function fetchNotificationsByUserId(userId: string) {
	return db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt));
}

export async function fetchUnreadNotificationsByUserId(userId: string) {
	return db
		.select()
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
		.orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(
	notificationId: string,
	userId: string,
) {
	const [notification] = await db
		.update(notifications)
		.set({
			read: true,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(notifications.id, notificationId),
				eq(notifications.userId, userId),
			),
		)
		.returning();

	return notification;
}

export async function markAllNotificationsAsRead(userId: string) {
	return db
		.update(notifications)
		.set({
			read: true,
			updatedAt: new Date(),
		})
		.where(eq(notifications.userId, userId))
		.returning();
}
