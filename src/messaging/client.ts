import amqp from "amqplib";
import { RABBITMQ_AMQP_URL } from "@/env";

let channel: amqp.Channel;

export async function connectRabbit() {

  const connection = await amqp.connect(RABBITMQ_AMQP_URL);

  connection.on("error", (err) => {

  });

  connection.on("close", () => {

  });

  channel = await connection.createChannel();

  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ não conectado");
  return channel;
}