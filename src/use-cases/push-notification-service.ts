import { fetchPushTokensByUserId } from "@/domains/push-tokens/db/repository";

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

type SendPushNotificationToUserParams = {
	userId: string;
	title: string;
	body: string;
	data?: Record<string, unknown>;
};

type ExpoPushMessage = {
	to: string;
	sound: "default";
	title: string;
	body: string;
	data?: Record<string, unknown>;
};

export async function sendPushNotificationToUser({
	userId,
	title,
	body,
	data,
}: SendPushNotificationToUserParams): Promise<void> {
	try {
		const pushTokens = await fetchPushTokensByUserId(userId);

		if (pushTokens.length === 0) {
			console.warn(
				`Nenhum Expo Push Token encontrado para o usuário ${userId}`,
			);
			return;
		}

		const messages: ExpoPushMessage[] = pushTokens.map((pushToken) => ({
			to: pushToken.token,
			sound: "default",
			title,
			body,
			data,
		}));

		const response = await fetch(EXPO_PUSH_SEND_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"Accept-Encoding": "gzip, deflate",
			},
			body: JSON.stringify(messages),
		});

		if (!response.ok) {
			const responseBody = await readExpoPushResponse(response);

			console.warn(
				`Falha ao enviar push notification para o usuário ${userId}: HTTP ${response.status}`,
				responseBody,
			);
			return;
		}

		const responseBody = await readExpoPushResponse(response);

		console.log(
			`Push notification enviada para o usuário ${userId}`,
			responseBody,
		);
	} catch (error) {
		console.warn(
			`Erro ao enviar push notification para o usuário ${userId}:`,
			error,
		);
	}
}

async function readExpoPushResponse(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}
