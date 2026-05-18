import { consumeTrackingCoordinatesUpdated } from "@/messaging/consumers/tracking-coordinates-updated-consumer";

export async function startRabbitConsumers() {
	await consumeTrackingCoordinatesUpdated();
}
