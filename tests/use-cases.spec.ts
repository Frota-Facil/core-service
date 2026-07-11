import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REQUEST_STATUSES } from "@/domains/requests/status";
import { ROUTES_STATUSES } from "@/domains/routes/status";
import { USER_ROLES } from "@/domains/users/roles";
import { VEHICLE_STATUSES } from "@/domains/vehicles/status";

vi.mock("@/domains/users/db/repository", () => ({
	deleteUserById: vi.fn(),
	fetchAdminUsers: vi.fn(),
	fetchUsers: vi.fn(),
	findUserAdminByCpf: vi.fn(),
	findUserByCpf: vi.fn(),
	findUserByEmail: vi.fn(),
	findUserByEmailAndRole: vi.fn(),
	findUserById: vi.fn(),
	insertUser: vi.fn(),
	updateUserById: vi.fn(),
}));

vi.mock("@/domains/vehicles/db/repository", () => ({
	deleteVehicle: vi.fn(),
	fetchAll: vi.fn(),
	fetchAllAvailable: vi.fn(),
	findById: vi.fn(),
	findByPlate: vi.fn(),
	insertVehicle: vi.fn(),
	updateVehicle: vi.fn(),
}));

vi.mock("@/domains/requests/db/repository", () => ({
	fetchRequests: vi.fn(),
	findActiveOrFutureRequestsByUserId: vi.fn(),
	findActiveOrFutureScheduleByVehicleId: vi.fn(),
	findRequestById: vi.fn(),
	findRequestsByVehicleId: vi.fn(),
	findVehicleScheduleConflict: vi.fn(),
	insertRequest: vi.fn(),
	updateRequestById: vi.fn(),
}));

vi.mock("@/domains/routes/db/repository", () => ({
	findRouteById: vi.fn(),
	findRouteByRequestId: vi.fn(),
	insertRoute: vi.fn(),
	updateRouteById: vi.fn(),
}));

vi.mock("@/domains/tracks/db/repository", () => ({
	findTracksByRouteId: vi.fn(),
	insertTrack: vi.fn(),
	updateTrackImageById: vi.fn(),
}));

vi.mock("@/domains/notifications/db/repository", () => ({
	createNotification: vi.fn(),
}));

vi.mock("@/domains/reports/db/repository", () => ({
	fetchRouteReportData: vi.fn(),
}));

vi.mock("@/services/ai-report-service", () => ({
	requestRouteReportFromAiService: vi.fn(),
}));

vi.mock("@/use-cases/audit-log-service", () => ({
	createAuditLog: vi.fn(),
}));

vi.mock("@/use-cases/notification-service", () => ({
	notifyAdminsAboutNewRequest: vi.fn(),
	notifyDriverAboutRequestApproved: vi.fn(),
	notifyDriverAboutRequestRejected: vi.fn(),
}));

vi.mock("@/use-cases/notifications/create-request-notification", () => ({
	createRequestApprovedNotificationUseCase: vi.fn(),
	createRequestRejectedNotificationUseCase: vi.fn(),
}));

import { fetchRouteReportData } from "@/domains/reports/db/repository";
import {
	findRequestById,
	findVehicleScheduleConflict,
	insertRequest,
	updateRequestById,
} from "@/domains/requests/db/repository";
import {
	findRouteById,
	findRouteByRequestId,
	insertRoute,
	updateRouteById,
} from "@/domains/routes/db/repository";
import {
	findTracksByRouteId,
	insertTrack,
} from "@/domains/tracks/db/repository";
import {
	fetchUsers,
	findUserAdminByCpf,
	findUserByCpf,
	findUserByEmail,
	findUserByEmailAndRole,
	findUserById,
	insertUser,
	updateUserById,
} from "@/domains/users/db/repository";
import {
	findByPlate,
	findById as findVehicleById,
	insertVehicle,
	updateVehicle as updateVehicleRepository,
} from "@/domains/vehicles/db/repository";
import { requestRouteReportFromAiService } from "@/services/ai-report-service";
import { createAuditLog } from "@/use-cases/audit-log-service";
import { authenticate } from "@/use-cases/authenticate";
import { authenticateAdmin } from "@/use-cases/authenticate-admin";
import {
	notifyAdminsAboutNewRequest,
	notifyDriverAboutRequestApproved,
	notifyDriverAboutRequestRejected,
} from "@/use-cases/notification-service";
import {
	createRequestApprovedNotificationUseCase,
	createRequestRejectedNotificationUseCase,
} from "@/use-cases/notifications/create-request-notification";
import { generateFleetReportUseCase } from "@/use-cases/reports/generate-fleet-report";
import { generateRouteReportUseCase } from "@/use-cases/reports/generate-route-report";
import { approveRequestUseCase } from "@/use-cases/requests/approve-request";
import { createRequestUseCase } from "@/use-cases/requests/create-request";
import { rejectRequestUseCase } from "@/use-cases/requests/reject-request";
import { finishRouteUseCase } from "@/use-cases/routes/finish-route";
import { startRouteUseCase } from "@/use-cases/routes/start-route";
import { createTrackUseCase } from "@/use-cases/tracks/create-track";
import { fetchRouteTracksUseCase } from "@/use-cases/tracks/fetch-route-tracks";
import { createUserUseCase } from "@/use-cases/users/create-user";
import { updateUserUseCase } from "@/use-cases/users/update-user";
import { registerVehicle } from "@/use-cases/vehicles/register-vehicle";
import { updateVehicle } from "@/use-cases/vehicles/update-vehicle";

const ids = {
	admin: "11111111-1111-4111-8111-111111111111",
	request: "22222222-2222-4222-8222-222222222222",
	route: "33333333-3333-4333-8333-333333333333",
	track: "44444444-4444-4444-8444-444444444444",
	user: "55555555-5555-4555-8555-555555555555",
	vehicle: "66666666-6666-4666-8666-666666666666",
};

const createdAt = new Date("2026-01-01T10:00:00.000Z");
const updatedAt = new Date("2026-01-01T10:10:00.000Z");

function makeUser(overrides = {}) {
	return {
		id: ids.user,
		name: "Sara Driver",
		email: "sara@example.com",
		cpf: "12345678901",
		cnh: "12345678900",
		phone: "85999999999",
		department: "Operacoes",
		role: USER_ROLES[0],
		passwordHash: "hash",
		createdAt,
		updatedAt,
		...overrides,
	};
}

function makeVehicle(overrides = {}) {
	return {
		id: ids.vehicle,
		plate: "ABC1D23",
		model: "Fiat Toro",
		year: 2024,
		odometer: 1200,
		imageUrl: null,
		status: VEHICLE_STATUSES[0],
		type: "CAR",
		createdAt,
		updatedAt,
		...overrides,
	};
}

function makeRequest(overrides = {}) {
	return {
		id: ids.request,
		userId: ids.user,
		vehicleId: ids.vehicle,
		approvedBy: null,
		status: REQUEST_STATUSES[0],
		predictedStartDate: new Date("2026-02-01T10:00:00.000Z"),
		predictedEndDate: new Date("2026-02-01T12:00:00.000Z"),
		reason: "Visita tecnica",
		createdAt,
		updatedAt,
		...overrides,
	};
}

function makeRoute(overrides = {}) {
	return {
		id: ids.route,
		requestId: ids.request,
		status: ROUTES_STATUSES[2],
		description: null,
		reportMarkdown: null,
		startedAt: new Date("2026-02-01T10:05:00.000Z"),
		finishedAt: null,
		createdAt,
		updatedAt,
		...overrides,
	};
}

function makeTrack(overrides = {}) {
	return {
		id: ids.track,
		routeId: ids.route,
		latitude: -3.7319,
		longitude: -38.5267,
		capturedAt: new Date("2026-02-01T10:15:00.000Z"),
		imageUrl: null,
		imageKey: null,
		createdAt,
		updatedAt,
		...overrides,
	};
}

const tokenService = {
	sign: vi.fn(() => "signed-token"),
	verify: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
	tokenService.sign.mockReturnValue("signed-token");
});

describe("autenticacao", () => {
	it("autentica motorista com email, senha valida e gera token com id e role", async () => {
		const passwordHash = await bcrypt.hash("secret", 10);
		vi.mocked(findUserByEmailAndRole).mockResolvedValue(
			makeUser({ passwordHash }),
		);

		const result = await authenticate(
			{ email: "sara@example.com", password: "secret" },
			tokenService,
		);

		expect(findUserByEmailAndRole).toHaveBeenCalledWith(
			"sara@example.com",
			"driver",
		);
		expect(tokenService.sign).toHaveBeenCalledWith({
			id: ids.user,
			role: "driver",
		});
		expect(result).toMatchObject({
			token: "signed-token",
			user: { id: ids.user, email: "sara@example.com", role: "driver" },
		});
	});

	it("rejeita login quando a senha nao confere", async () => {
		const passwordHash = await bcrypt.hash("secret", 10);
		vi.mocked(findUserByEmailAndRole).mockResolvedValue(
			makeUser({ passwordHash }),
		);

		await expect(
			authenticate(
				{ email: "sara@example.com", password: "wrong" },
				tokenService,
			),
		).rejects.toThrow("Credenciais inválidas");
		expect(tokenService.sign).not.toHaveBeenCalled();
	});

	it("autentica administrador usando cpf e role de admin", async () => {
		const passwordHash = await bcrypt.hash("admin-secret", 10);
		vi.mocked(findUserAdminByCpf).mockResolvedValue(
			makeUser({ id: ids.admin, role: USER_ROLES[1], passwordHash }),
		);

		const result = await authenticateAdmin(
			{ cpf: "12345678901", password: "admin-secret" },
			tokenService,
		);

		expect(findUserAdminByCpf).toHaveBeenCalledWith("12345678901");
		expect(tokenService.sign).toHaveBeenCalledWith({
			id: ids.admin,
			role: "admin",
		});
		expect(result.user.role).toBe("admin");
	});
});

describe("usuarios", () => {
	it("cria usuario com senha hasheada, sem vazar passwordHash e com auditoria", async () => {
		vi.mocked(findUserByEmail).mockResolvedValue(undefined);
		vi.mocked(findUserByCpf).mockResolvedValue(undefined);
		vi.mocked(insertUser).mockImplementation(async (data) =>
			makeUser({ ...data, passwordHash: data.passwordHash }),
		);

		const result = await createUserUseCase(
			{
				name: "Sara Driver",
				email: "sara@example.com",
				cpf: "12345678901",
				cnh: "12345678900",
				phone: "85999999999",
				department: "Operacoes",
				role: USER_ROLES[0],
				password: "secret",
			},
			ids.admin,
		);

		const inserted = vi.mocked(insertUser).mock.calls[0][0];
		expect(await bcrypt.compare("secret", inserted.passwordHash)).toBe(true);
		expect(result).not.toHaveProperty("passwordHash");
		expect(createAuditLog).toHaveBeenCalledWith({
			action: "USER.CREATED",
			entityId: ids.user,
			performedBy: ids.admin,
		});
	});

	it("bloqueia criacao quando email ja existe", async () => {
		vi.mocked(findUserByEmail).mockResolvedValue(makeUser());
		vi.mocked(findUserByCpf).mockResolvedValue(undefined);

		await expect(
			createUserUseCase({
				name: "Sara Driver",
				email: "sara@example.com",
				cpf: "12345678901",
				cnh: "12345678900",
				phone: "85999999999",
				department: "Operacoes",
				role: USER_ROLES[0],
				password: "secret",
			}),
		).rejects.toThrow("E-mail já está em uso");
		expect(insertUser).not.toHaveBeenCalled();
	});

	it("atualiza usuario sem consultar duplicidade quando email e cpf permanecem iguais", async () => {
		vi.mocked(findUserById).mockResolvedValue(makeUser());
		vi.mocked(updateUserById).mockResolvedValue(
			makeUser({ name: "Sara Updated" }),
		);

		const result = await updateUserUseCase(ids.user, {
			name: "Sara Updated",
			email: "sara@example.com",
			cpf: "12345678901",
			cnh: "12345678900",
			phone: "85888888888",
			department: "Operacoes",
			role: USER_ROLES[0],
		});

		expect(findUserByEmail).not.toHaveBeenCalled();
		expect(findUserByCpf).not.toHaveBeenCalled();
		expect(result.name).toBe("Sara Updated");
	});

	it("retorna usuarios sem passwordHash ao listar", async () => {
		vi.mocked(fetchUsers).mockResolvedValue([makeUser()]);
		const { fetchUsersUseCase } = await import("@/use-cases/users/fetch-users");

		const result = await fetchUsersUseCase();

		expect(result).toHaveLength(1);
		expect(result[0]).not.toHaveProperty("passwordHash");
	});
});

describe("veiculos", () => {
	it("registra veiculo quando placa ainda nao existe e grava auditoria", async () => {
		vi.mocked(findByPlate).mockResolvedValue(undefined);
		vi.mocked(insertVehicle).mockResolvedValue(makeVehicle());

		const result = await registerVehicle(
			{
				plate: "ABC1D23",
				model: "Fiat Toro",
				year: 2024,
				odometer: 1200,
				status: VEHICLE_STATUSES[0],
				type: "CAR",
			},
			ids.admin,
		);

		expect(insertVehicle).toHaveBeenCalledWith({
			plate: "ABC1D23",
			model: "Fiat Toro",
			year: 2024,
			odometer: 1200,
			imageUrl: null,
			status: "AVAILABLE",
			type: "CAR",
		});
		expect(createAuditLog).toHaveBeenCalledWith({
			action: "VEHICLE.CREATED",
			entityId: ids.vehicle,
			performedBy: ids.admin,
		});
		expect(result.id).toBe(ids.vehicle);
	});

	it("bloqueia registro com placa duplicada", async () => {
		vi.mocked(findByPlate).mockResolvedValue(makeVehicle());

		await expect(
			registerVehicle({
				plate: "ABC1D23",
				model: "Fiat Toro",
				year: 2024,
				odometer: 1200,
				status: VEHICLE_STATUSES[0],
				type: "CAR",
			}),
		).rejects.toThrow("A placa desse veículo já foi registrada");
		expect(insertVehicle).not.toHaveBeenCalled();
	});

	it("atualiza veiculo quando a placa encontrada pertence ao mesmo id", async () => {
		vi.mocked(findVehicleById).mockResolvedValue(makeVehicle());
		vi.mocked(findByPlate).mockResolvedValue(makeVehicle());
		vi.mocked(updateVehicleRepository).mockResolvedValue(
			makeVehicle({ model: "Fiat Strada" }),
		);

		const result = await updateVehicle(
			ids.vehicle,
			{
				plate: "ABC1D23",
				model: "Fiat Strada",
				year: 2024,
				odometer: 1400,
				status: VEHICLE_STATUSES[0],
				type: "CAR",
			},
			ids.admin,
		);

		expect(updateVehicleRepository).toHaveBeenCalled();
		expect(result.model).toBe("Fiat Strada");
		expect(createAuditLog).toHaveBeenCalledWith({
			action: "VEHICLE.UPDATED",
			entityId: ids.vehicle,
			performedBy: ids.admin,
		});
	});
});

describe("solicitacoes", () => {
	it("cria solicitacao pendente apos validar periodo, usuario, veiculo e conflito", async () => {
		const request = makeRequest();
		vi.mocked(findUserById).mockResolvedValue(makeUser());
		vi.mocked(findVehicleById).mockResolvedValue(makeVehicle());
		vi.mocked(findVehicleScheduleConflict).mockResolvedValue(undefined);
		vi.mocked(insertRequest).mockResolvedValue(request);

		const result = await createRequestUseCase(
			{
				userId: ids.user,
				vehicleId: ids.vehicle,
				predictedStartDate: request.predictedStartDate,
				predictedEndDate: request.predictedEndDate,
				reason: request.reason,
			},
			ids.user,
		);

		expect(insertRequest).toHaveBeenCalledWith({
			userId: ids.user,
			vehicleId: ids.vehicle,
			status: "PENDING",
			predictedStartDate: request.predictedStartDate,
			predictedEndDate: request.predictedEndDate,
			reason: request.reason,
		});
		expect(createAuditLog).toHaveBeenCalledWith({
			action: "REQUEST.CREATED",
			entityId: ids.request,
			performedBy: ids.user,
		});
		expect(notifyAdminsAboutNewRequest).toHaveBeenCalledWith(ids.request);
		expect(result.status).toBe("PENDING");
	});

	it("rejeita solicitacao com periodo final menor ou igual ao inicial", async () => {
		const sameDate = new Date("2026-02-01T10:00:00.000Z");

		await expect(
			createRequestUseCase({
				userId: ids.user,
				vehicleId: ids.vehicle,
				predictedStartDate: sameDate,
				predictedEndDate: sameDate,
				reason: "Visita tecnica",
			}),
		).rejects.toThrow("A data final deve ser maior que a data inicial");
		expect(findUserById).not.toHaveBeenCalled();
	});

	it("aprova solicitacao pendente, registra auditoria, notifica e retorna atualizada", async () => {
		vi.mocked(findRequestById).mockResolvedValue(makeRequest());
		vi.mocked(updateRequestById).mockResolvedValue(
			makeRequest({ status: REQUEST_STATUSES[1], approvedBy: ids.admin }),
		);

		const result = await approveRequestUseCase(ids.request, ids.admin);

		expect(updateRequestById).toHaveBeenCalledWith(ids.request, {
			status: "APPROVED",
			approvedBy: ids.admin,
		});
		expect(createAuditLog).toHaveBeenCalledWith({
			action: "REQUEST.APPROVED",
			entityId: ids.request,
			performedBy: ids.admin,
		});
		expect(createRequestApprovedNotificationUseCase).toHaveBeenCalledWith(
			ids.request,
		);
		expect(notifyDriverAboutRequestApproved).toHaveBeenCalledWith(ids.request);
		expect(result.status).toBe("APPROVED");
	});

	it("impede aprovar solicitacao que nao esta pendente", async () => {
		vi.mocked(findRequestById).mockResolvedValue(
			makeRequest({ status: REQUEST_STATUSES[1] }),
		);

		await expect(approveRequestUseCase(ids.request, ids.admin)).rejects.toThrow(
			"A solicitação não está pendente",
		);
		expect(updateRequestById).not.toHaveBeenCalled();
	});

	it("rejeita solicitacao pendente e dispara notificacoes de recusa", async () => {
		vi.mocked(findRequestById).mockResolvedValue(makeRequest());
		vi.mocked(updateRequestById).mockResolvedValue(
			makeRequest({ status: REQUEST_STATUSES[2] }),
		);

		const result = await rejectRequestUseCase(ids.request, ids.admin);

		expect(updateRequestById).toHaveBeenCalledWith(ids.request, {
			status: "REJECTED",
		});
		expect(createRequestRejectedNotificationUseCase).toHaveBeenCalledWith(
			ids.request,
		);
		expect(notifyDriverAboutRequestRejected).toHaveBeenCalledWith(ids.request);
		expect(result.status).toBe("REJECTED");
	});
});

describe("rotas", () => {
	it("inicia rota somente para solicitacao aprovada e sem rota existente", async () => {
		vi.mocked(findRequestById).mockResolvedValue(
			makeRequest({ status: REQUEST_STATUSES[1] }),
		);
		vi.mocked(findRouteByRequestId).mockResolvedValue(undefined);
		vi.mocked(insertRoute).mockResolvedValue(makeRoute());

		const result = await startRouteUseCase(ids.request, ids.user);

		expect(insertRoute).toHaveBeenCalledWith({
			requestId: ids.request,
			status: "STARTED",
			description: null,
			startedAt: expect.any(Date),
		});
		expect(createAuditLog).toHaveBeenCalledWith({
			action: "TRIP.STARTED",
			entityId: ids.route,
			performedBy: ids.user,
		});
		expect(result.status).toBe("STARTED");
	});

	it("bloqueia inicio quando solicitacao ainda nao foi aprovada", async () => {
		vi.mocked(findRequestById).mockResolvedValue(makeRequest());

		await expect(startRouteUseCase(ids.request, ids.user)).rejects.toThrow(
			"A solicitação ainda não foi aprovada",
		);
		expect(insertRoute).not.toHaveBeenCalled();
	});

	it("finaliza rota iniciada, remove reportMarkdown da resposta e agenda geracao de relatorio", async () => {
		vi.mocked(findRouteById).mockResolvedValue(makeRoute());
		vi.mocked(updateRouteById)
			.mockResolvedValueOnce(
				makeRoute({
					status: ROUTES_STATUSES[3],
					description: "Finalizada sem ocorrencias",
					finishedAt: new Date("2026-02-01T12:00:00.000Z"),
					reportMarkdown: "# Relatorio antigo",
				}),
			)
			.mockResolvedValueOnce(
				makeRoute({ status: ROUTES_STATUSES[3], reportMarkdown: "# Novo" }),
			);
		vi.mocked(fetchRouteReportData).mockResolvedValue({
			route: makeRoute({ status: ROUTES_STATUSES[3] }),
			request: makeRequest(),
			user: makeUser(),
			vehicle: makeVehicle(),
			tracks: [],
		});
		vi.mocked(requestRouteReportFromAiService).mockResolvedValue({
			markdown_content: "# Novo",
		});

		const result = await finishRouteUseCase(
			ids.route,
			{ description: "Finalizada sem ocorrencias" },
			ids.user,
		);
		await vi.waitFor(() =>
			expect(requestRouteReportFromAiService).toHaveBeenCalled(),
		);

		expect(updateRouteById).toHaveBeenNthCalledWith(1, ids.route, {
			status: "FINISHED",
			description: "Finalizada sem ocorrencias",
			finishedAt: expect.any(Date),
		});
		expect(updateRouteById).toHaveBeenLastCalledWith(ids.route, {
			reportMarkdown: "# Novo",
		});
		expect(createAuditLog).toHaveBeenCalledWith({
			action: "TRIP.FINISHED",
			entityId: ids.route,
			performedBy: ids.user,
		});
		expect(result).not.toHaveProperty("reportMarkdown");
		expect(result.status).toBe("FINISHED");
	});

	it("impede finalizar rota que nao esta iniciada", async () => {
		vi.mocked(findRouteById).mockResolvedValue(
			makeRoute({ status: ROUTES_STATUSES[1] }),
		);

		await expect(
			finishRouteUseCase(ids.route, { description: "fim" }, ids.user),
		).rejects.toThrow("A rota ainda não foi iniciada ou já foi finalizada");
		expect(updateRouteById).not.toHaveBeenCalled();
	});
});

describe("tracks e relatorios", () => {
	it("cria track apenas quando a rota existe", async () => {
		vi.mocked(findRouteById).mockResolvedValue(makeRoute());
		vi.mocked(insertTrack).mockResolvedValue(makeTrack());

		const result = await createTrackUseCase({
			routeId: ids.route,
			latitude: -3.7319,
			longitude: -38.5267,
		});

		expect(insertTrack).toHaveBeenCalledWith({
			id: expect.any(String),
			routeId: ids.route,
			latitude: -3.7319,
			longitude: -38.5267,
			capturedAt: expect.any(Date),
		});
		expect(result.id).toBe(ids.track);
	});

	it("lista tracks de uma rota existente", async () => {
		vi.mocked(findRouteById).mockResolvedValue(makeRoute());
		vi.mocked(findTracksByRouteId).mockResolvedValue([makeTrack()]);

		const result = await fetchRouteTracksUseCase(ids.route);

		expect(findTracksByRouteId).toHaveBeenCalledWith(ids.route);
		expect(result).toHaveLength(1);
	});

	it("retorna relatorio de frota ja salvo na rota", async () => {
		vi.mocked(findRouteById).mockResolvedValue(
			makeRoute({ reportMarkdown: "# Relatorio" }),
		);

		const result = await generateFleetReportUseCase({ routeId: ids.route });

		expect(result).toEqual({
			routeId: ids.route,
			markdown_content: "# Relatorio",
		});
	});

	it("bloqueia relatorio de frota quando markdown ainda nao existe", async () => {
		vi.mocked(findRouteById).mockResolvedValue(makeRoute());

		await expect(
			generateFleetReportUseCase({ routeId: ids.route }),
		).rejects.toThrow("Relatório da rota ainda não foi gerado");
	});

	it("monta payload normalizado e retorna markdown gerado pela IA", async () => {
		const firstTrack = makeTrack({
			id: ids.track,
			capturedAt: new Date("2026-02-01T10:15:00.000Z"),
			imageUrl: "https://storage.example.com/tracks/1.png",
			imageKey: "tracks/route/1.png",
		});
		const secondTrack = makeTrack({
			id: "77777777-7777-4777-8777-777777777777",
			latitude: -3.735,
			longitude: -38.53,
			capturedAt: new Date("2026-02-01T11:45:00.000Z"),
		});

		vi.mocked(fetchRouteReportData).mockResolvedValue({
			route: makeRoute({ finishedAt: new Date("2026-02-01T12:00:00.000Z") }),
			request: makeRequest(),
			user: makeUser(),
			vehicle: makeVehicle(),
			tracks: [firstTrack, secondTrack],
		});
		vi.mocked(requestRouteReportFromAiService).mockResolvedValue({
			markdown_content: "# Relatorio da rota",
		});

		const result = await generateRouteReportUseCase(ids.route);

		expect(requestRouteReportFromAiService).toHaveBeenCalledWith(
			expect.objectContaining({
				route: expect.objectContaining({
					id: ids.route,
					started_at: "2026-02-01T10:05:00.000Z",
					finished_at: "2026-02-01T12:00:00.000Z",
				}),
				tracks: [
					{
						id: ids.track,
						route_id: ids.route,
						latitude: -3.7319,
						longitude: -38.5267,
						captured_at: "2026-02-01T10:15:00.000Z",
						image_url: "https://storage.example.com/tracks/1.png",
						image_key: "tracks/route/1.png",
						created_at: createdAt.toISOString(),
						updated_at: updatedAt.toISOString(),
					},
					{
						id: "77777777-7777-4777-8777-777777777777",
						route_id: ids.route,
						latitude: -3.735,
						longitude: -38.53,
						captured_at: "2026-02-01T11:45:00.000Z",
						image_url: null,
						image_key: null,
						created_at: createdAt.toISOString(),
						updated_at: updatedAt.toISOString(),
					},
				],
				metadata: {
					source: "core-service",
					report_type: "route",
					total_tracks: 2,
					duration_minutes: 115,
					first_track_time: "2026-02-01T10:15:00.000Z",
					last_track_time: "2026-02-01T11:45:00.000Z",
				},
			}),
		);
		expect(result).toBe("# Relatorio da rota");
	});
});
