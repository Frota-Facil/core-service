import type { ServerResponse } from "node:http";
import {
	type RouteStartedEventDTO,
	routeStartedEventSchema,
} from "@/contracts/routes/route-started-event-schema";

const routeEventClients = new Set<ServerResponse>();

export function registerRouteEventClient(client: ServerResponse): () => void {
	routeEventClients.add(client);

	return () => {
		routeEventClients.delete(client);
	};
}

export function publishRouteStartedEvent(payload: RouteStartedEventDTO): void {
	const event = routeStartedEventSchema.parse(payload);
	const message = formatSseMessage("route.started", event);

	for (const client of routeEventClients) {
		try {
			client.write(message);
		} catch (error) {
			routeEventClients.delete(client);
			console.error("Erro ao enviar evento SSE de rota iniciada:", error);
		}
	}
}

function formatSseMessage(eventName: string, data: unknown): string {
	return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
}
