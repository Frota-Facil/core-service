import fp from "fastify-plugin";
import { connectRabbit } from "@/messaging/client";
import { startRabbitConsumers } from "@/messaging/consumers";
import { setupRabbit } from "@/messaging/setup";

export default fp(async () => {
	await connectRabbit();
	await setupRabbit();
	await startRabbitConsumers();

	console.info("RabbitMQ pronto 🚀");
});
