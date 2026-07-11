import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import {
	fetchNotificationsByUserId,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "@/domains/notifications/db/repository";
import { USER_ROLES } from "@/domains/users/roles";
import { authorize } from "@/hooks/authorize";
import { verifyJwt } from "@/hooks/verify-jwt";

const notificationIdParamSchema = z.object({
	notificationId: z.string().uuid(),
});

export async function notificationRouter(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/notifications",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
		},
		async (request, reply) => {
			const notifications = await fetchNotificationsByUserId(request.user.id);

			return reply.status(200).send(notifications);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().patch(
		"/notifications/read-all",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
		},
		async (request, reply) => {
			const notifications = await markAllNotificationsAsRead(request.user.id);

			return reply.status(200).send(notifications);
		},
	);

	app.withTypeProvider<ZodTypeProvider>().patch(
		"/notifications/:notificationId/read",
		{
			preHandler: [verifyJwt, authorize([USER_ROLES[0], USER_ROLES[1]])],
			schema: {
				params: notificationIdParamSchema,
			},
		},
		async (request, reply) => {
			const notification = await markNotificationAsRead(
				request.params.notificationId,
				request.user.id,
			);

			if (!notification) {
				return reply.status(404).send({
					message: "Notificação não encontrada",
				});
			}

			return reply.status(200).send(notification);
		},
	);
}
