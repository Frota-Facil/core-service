import type { FastifyReply, FastifyRequest } from "fastify";

export async function verifyJwt(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	try {
		await request.jwtVerify();
	} catch {
		reply.status(401).send({ error: "Token inválido ou expirado" });
	}
}
