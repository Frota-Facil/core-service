import fp from "fastify-plugin";
import { startRabbitConsumers } from "@/messaging/consumers";
import { connectRabbit } from "@/messaging/client";
import { setupRabbit } from "@/messaging/setup";

export default fp(async () => {
	await connectRabbit();
	await setupRabbit();
	await startRabbitConsumers();

	console.info("RabbitMQ pronto 🚀");
});
