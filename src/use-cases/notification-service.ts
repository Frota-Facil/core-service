import {
	findRequestById,
	type Request,
} from "@/domains/requests/db/repository";
import { fetchAdminUsers, findUserById } from "@/domains/users/db/repository";
import type { User } from "@/domains/users/schema";
import type { Vehicle } from "@/domains/vehicles/db/repository";
import { findById } from "@/domains/vehicles/db/repository";
import { getChannel } from "@/messaging/client";
import { EXCHANGES } from "@/messaging/exchanges";
import { ROUTING_KEYS } from "@/messaging/routing-keys";

type SolicitationNotificationStatus = "pending" | "approved" | "rejected";

type SolicitationNotificationPayload = {
	recipients: string[];
	subject: string;
	message: string;
	data: {
		requestId: string;
		userId: string;
		userName: string;
		userEmail: string;
		vehicleId: string;
		vehicleName: string;
		vehiclePlate: string;
		reason: string;
		status: SolicitationNotificationStatus;
		startsAt: string;
		endsAt: string;
	};
};

type SolicitationNotificationContext = {
	request: Request;
	driver: User;
	vehicle: Vehicle;
};

export async function notifyAdminsAboutNewRequest(
	requestId: string,
): Promise<void> {
	try {
		const context = await loadSolicitationNotificationContext(requestId);

		if (!context) {
			return;
		}

		const admins = await fetchAdminUsers();
		const adminEmails = admins
			.map((admin) => admin.email)
			.filter((email) => email.trim().length > 0);

		if (adminEmails.length === 0) {
			console.warn(
				`Nenhum admin com email encontrado para notificar sobre a nova solicitação ${requestId}`,
			);
			return;
		}

		await publishNotification(
			buildNewRequestAdminPayload(context, adminEmails),
			"admins",
		);
	} catch (error) {
		console.error(
			`Erro ao preparar notificação para admins da solicitação ${requestId}:`,
			error,
		);
	}
}

export async function notifyDriverAboutRequestApproved(
	requestId: string,
): Promise<void> {
	await notifyDriverAboutRequestStatusChanged(requestId, "approved");
}

export async function notifyDriverAboutRequestRejected(
	requestId: string,
): Promise<void> {
	await notifyDriverAboutRequestStatusChanged(requestId, "rejected");
}

async function notifyDriverAboutRequestStatusChanged(
	requestId: string,
	status: "approved" | "rejected",
): Promise<void> {
	try {
		const context = await loadSolicitationNotificationContext(requestId);

		if (!context) {
			return;
		}

		if (!context.driver.email.trim()) {
			console.warn(
				`Motorista sem email para notificar sobre a solicitação ${requestId}`,
			);
			return;
		}

		await publishNotification(
			buildDriverStatusPayload(context, status),
			"motorista",
		);
	} catch (error) {
		console.error(
			`Erro ao preparar notificação para motorista da solicitação ${requestId}:`,
			error,
		);
	}
}

async function loadSolicitationNotificationContext(
	requestId: string,
): Promise<SolicitationNotificationContext | null> {
	const request = await findRequestById(requestId);

	if (!request) {
		console.warn(`Solicitação ${requestId} não encontrada para notificação`);
		return null;
	}

	const driver = await findUserById(request.userId);

	if (!driver) {
		console.warn(
			`Usuário ${request.userId} não encontrado para notificar a solicitação ${requestId}`,
		);
		return null;
	}

	const vehicle = await findById(request.vehicleId);

	if (!vehicle) {
		console.warn(
			`Veículo ${request.vehicleId} não encontrado para notificar a solicitação ${requestId}`,
		);
		return null;
	}

	return {
		request,
		driver,
		vehicle,
	};
}

function buildNewRequestAdminPayload(
	context: SolicitationNotificationContext,
	recipients: string[],
): SolicitationNotificationPayload {
	const data = buildNotificationData(context, "pending");

	return {
		recipients,
		subject: "Nova solicitação de veículo",
		message: `Uma nova solicitação de veículo foi criada. Motorista: ${data.userName}. Veículo: ${data.vehicleName}. Placa: ${data.vehiclePlate}. Motivo: ${data.reason}. Início: ${data.startsAt}. Fim: ${data.endsAt}.`,
		data,
	};
}

function buildDriverStatusPayload(
	context: SolicitationNotificationContext,
	status: "approved" | "rejected",
): SolicitationNotificationPayload {
	const data = buildNotificationData(context, status);
	const statusLabel = getStatusLabel(status);

	return {
		recipients: [context.driver.email],
		subject: `Sua solicitação de veículo foi ${statusLabel}`,
		message: `Sua solicitação de veículo foi ${statusLabel}. Veículo: ${data.vehicleName}. Placa: ${data.vehiclePlate}. Motivo: ${data.reason}. Início: ${data.startsAt}. Fim: ${data.endsAt}.`,
		data,
	};
}

function buildNotificationData(
	context: SolicitationNotificationContext,
	status: SolicitationNotificationStatus,
): SolicitationNotificationPayload["data"] {
	return {
		requestId: context.request.id,
		userId: context.driver.id,
		userName: context.driver.name,
		userEmail: context.driver.email,
		vehicleId: context.vehicle.id,
		vehicleName: context.vehicle.model,
		vehiclePlate: context.vehicle.plate,
		reason: context.request.reason,
		status,
		startsAt: context.request.predictedStartDate.toISOString(),
		endsAt: context.request.predictedEndDate.toISOString(),
	};
}

function getStatusLabel(status: "approved" | "rejected"): string {
	return status === "approved" ? "aprovada" : "recusada";
}

async function publishNotification(
	payload: SolicitationNotificationPayload,
	audience: string,
): Promise<void> {
	try {
		const channel = getChannel();
		const wasPublished = channel.publish(
			EXCHANGES.EVENTS,
			ROUTING_KEYS.NOTIFICATION_SOLICITATION_CREATED,
			Buffer.from(JSON.stringify(payload)),
			{
				contentType: "application/json",
				persistent: true,
			},
		);

		if (!wasPublished) {
			console.warn(
				`RabbitMQ sinalizou backpressure ao publicar notificação para ${audience}`,
			);
		}
	} catch (error) {
		console.error(
			`Erro ao publicar notificação da solicitação para ${audience}:`,
			error,
		);
	}
}
