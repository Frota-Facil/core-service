import amqp from "amqplib";
import { RABBITMQ_AMQP_URL } from "@/env";

let channel: amqp.Channel;

export async function connectRabbit() {
	const connection = await amqp.connect(RABBITMQ_AMQP_URL);

	connection.on("error", (err) => {
		console.error(`Erro·ao·conectar·com·o·rabbitMQ: ${err}`);
	});

	connection.on("close", () => {
		console.warn("Conexão com o rabbitMQ encerrada!");
	});

	channel = await connection.createChannel();

	return channel;
}

export function getChannel() {
	if (!channel) throw new Error("RabbitMQ não conectado");
	return channel;
}
