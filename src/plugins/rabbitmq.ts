import fp from "fastify-plugin";
import { connectRabbit } from "@/messaging/client";
import { setupRabbit } from "@/messaging/setup";

export default fp(async () => {
	await connectRabbit();
	await setupRabbit();

	console.info("RabbitMQ pronto 🚀");
});
