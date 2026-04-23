import type { FastifyInstance } from "fastify";
import type { TokenService } from "@/use-cases/token-service";

export function makeFastifyJwtService(app: FastifyInstance): TokenService {
	return {
		sign(payload) {
			return app.jwt.sign(payload);
		},
		verify(token) {
			return app.jwt.verify(token);
		},
	};
}
