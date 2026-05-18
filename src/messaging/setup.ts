// setup.ts
import { getChannel } from "@/messaging/client";
import { EXCHANGES } from "@/messaging/exchanges";
import { QUEUES } from "@/messaging/queues";
import { ROUTING_KEYS } from "@/messaging/routing-keys";

export async function setupRabbit() {
	const ch = getChannel();

	await ch.assertExchange(EXCHANGES.EVENTS, "topic", {
		durable: true,
	});

	await ch.assertQueue(QUEUES.NOTIFICATION_SOLICITATION_CREATED, {
		durable: true,
	});

	await ch.assertQueue(QUEUES.TRACKING_COORDINATES_UPDATED, {
		durable: true,
	});

	await ch.assertExchange(EXCHANGES.TRACKING, "topic", {
		durable: true,
	})

	await ch.bindQueue(
		QUEUES.TRACKING_COORDINATES_UPDATED,
		EXCHANGES.TRACKING,
		ROUTING_KEYS.TRACKING_COORDINATES_UPDATED,
	)

	await ch.bindQueue(
		QUEUES.NOTIFICATION_SOLICITATION_CREATED,
		EXCHANGES.EVENTS,
		ROUTING_KEYS.NOTIFICATION_SOLICITATION_CREATED,
	);
}
