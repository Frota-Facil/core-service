import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
	uploadPresignedResponseSchema,
	uploadPresignedSchema,
} from "@/contracts/upload-presigned-schema";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";
import { generateUploadUrl } from "@/minio/generate-upload-url";

export async function uploadRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/admin/upload/presigned",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[1]])],
			schema: {
				body: uploadPresignedSchema,
				response: {
					200: uploadPresignedResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const data = await generateUploadUrl(request.body);

			return reply.status(200).send(data);
		},
	);
}
