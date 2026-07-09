import type { FastifyInstance, FastifyRequest } from "fastify";
import {
	Counter,
	collectDefaultMetrics,
	Histogram,
	Registry,
} from "prom-client";

const metricsRegistry = new Registry();
const requestStarts = new WeakMap<FastifyRequest, bigint>();

collectDefaultMetrics({ register: metricsRegistry });

const httpRequestsTotal = new Counter({
	name: "http_requests_total",
	help: "Total number of HTTP requests.",
	labelNames: ["method", "route", "status"] as const,
	registers: [metricsRegistry],
});

const httpRequestDurationSeconds = new Histogram({
	name: "http_request_duration_seconds",
	help: "HTTP request duration in seconds.",
	labelNames: ["method", "route", "status"] as const,
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [metricsRegistry],
});

export function setupMetrics(app: FastifyInstance) {
	app.addHook("onRequest", async (request) => {
		if (request.url === "/metrics") {
			return;
		}

		requestStarts.set(request, process.hrtime.bigint());
	});

	app.addHook("onResponse", async (request, reply) => {
		const startedAt = requestStarts.get(request);

		if (!startedAt) {
			return;
		}

		const durationSeconds =
			Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
		const labels = {
			method: request.method,
			route: request.routeOptions.url ?? "unmatched",
			status: String(reply.statusCode),
		};

		httpRequestsTotal.inc(labels);
		httpRequestDurationSeconds.observe(labels, durationSeconds);
	});

	app.get("/metrics", async (_, reply) => {
		return reply
			.header("Content-Type", metricsRegistry.contentType)
			.send(await metricsRegistry.metrics());
	});
}
