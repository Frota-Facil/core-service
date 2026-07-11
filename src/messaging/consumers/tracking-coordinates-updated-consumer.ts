import { z } from "zod";
import { getChannel } from "@/messaging/client";
import { QUEUES } from "@/messaging/queues";
import { createTrackUseCase } from "@/use-cases/tracks/create-track";

const trackingCoordinatesUpdatedSchema = z.preprocess(
	(payload) => {
		if (!payload || typeof payload !== "object") {
			return payload;
		}

		const data = payload as Record<string, unknown>;

		return {
			routeId: data.routeId ?? data.route_id,
			xCoordinate: data.xCoordinate ?? data.x_coordinate,
			yCoordinate: data.yCoordinate ?? data.y_coordinate,
			createdAt: data.createdAt ?? data.created_at,
		};
	},
	z.object({
		routeId: z.uuid(),
		xCoordinate: z.number(),
		yCoordinate: z.number(),
		createdAt: z.coerce.date(),
	}),
);

export async function consumeTrackingCoordinatesUpdated() {
	const ch = getChannel();

	await ch.prefetch(10);

	await ch.consume(QUEUES.TRACKING_COORDINATES_UPDATED, async (message) => {
		if (!message) {
			return;
		}

		try {
			const payload = JSON.parse(message.content.toString("utf8"));

			console.table(payload);
			const data = trackingCoordinatesUpdatedSchema.parse(payload);

			await createTrackUseCase(data);

			ch.ack(message);
		} catch (error) {
			if (error instanceof SyntaxError || error instanceof z.ZodError) {
				console.error(
					"Mensagem inválida em tracking.coordinates.updated",
					error,
				);
				ch.ack(message);
				return;
			}

			console.error("Erro ao consumir tracking.coordinates.updated", error);
			ch.nack(message, false, true);
		}
	});

	console.info(
		`Consumer RabbitMQ ouvindo fila ${QUEUES.TRACKING_COORDINATES_UPDATED}`,
	);
}
