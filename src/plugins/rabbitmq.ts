import fp from "fastify-plugin";
import { connectRabbit } from "@/messaging/client";
import { setupRabbit } from "@/messaging/setup";

export default fp(async (app) => {
	await connectRabbit(app.log);
	await setupRabbit(app.log);

	app.log.info("RabbitMQ pronto 🚀");
});
