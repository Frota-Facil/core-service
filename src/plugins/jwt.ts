import fastifyJwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { env } from "@/env";

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.register(fastifyJwt, {
		secret: env.JWT_SECRET,
		sign: {
			expiresIn: "1h",
		},
	});
};

export default fp(jwtPlugin);
