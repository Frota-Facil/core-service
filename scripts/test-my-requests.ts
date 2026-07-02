import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { auditLogs } from "@/domains/audit-logs/schema";
import { users } from "@/domains/users/schema";
import { vehicles } from "@/domains/vehicles/schema";
import { db } from "@/drizzle/client";

const baseUrl = process.env.TEST_API_URL ?? "http://localhost:3333";
const suffix = Date.now().toString().slice(-8);
const testPassword = `Codex-${suffix}`;

type ApiResponse<T> = {
	status: number;
	body: T;
};

type AuthResponse = {
	token: string;
	user: { id: string };
};

type UserResponse = {
	id: string;
};

type VehicleResponse = {
	id: string;
	plate: string;
	model: string;
	status: string;
};

type RequestResponse = {
	id: string;
	userId: string;
	vehicleId: string;
	status: string;
	destination: string;
	reason: string;
	vehicle?: VehicleResponse;
	passwordHash?: string;
};

type TripResponse = {
	id: string;
	requestId: string;
	routeStatus: string;
	requestStatus: string;
	description: string | null;
	vehicle: VehicleResponse;
};

let adminId: string | undefined;
let driverAId: string | undefined;
let driverBId: string | undefined;
let vehicleId: string | undefined;

async function api<T>(
	method: string,
	path: string,
	options: { token?: string; body?: unknown } = {},
): Promise<ApiResponse<T>> {
	const headers: Record<string, string> = {};

	if (options.token) {
		headers.authorization = `Bearer ${options.token}`;
	}

	if (options.body !== undefined) {
		headers["content-type"] = "application/json";
	}

	const response = await fetch(`${baseUrl}${path}`, {
		method,
		headers,
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	});
	const text = await response.text();
	const body = text ? JSON.parse(text) : null;

	return { status: response.status, body };
}

function expectStatus<T>(
	name: string,
	response: ApiResponse<T>,
	expectedStatus: number,
) {
	assert.equal(
		response.status,
		expectedStatus,
		`${name}: status ${response.status}, body ${JSON.stringify(response.body)}`,
	);
	console.log(`✓ ${name}`);
}

async function cleanup() {
	const userIds = [adminId, driverAId, driverBId].filter(
		(id): id is string => id !== undefined,
	);

	if (userIds.length > 0) {
		await db.delete(auditLogs).where(inArray(auditLogs.performedBy, userIds));
		await db.delete(users).where(inArray(users.id, userIds));
	}

	if (vehicleId) {
		await db.delete(vehicles).where(eq(vehicles.id, vehicleId));
	}
}

async function run() {
	const passwordHash = await bcrypt.hash(testPassword, 4);
	const [admin] = await db
		.insert(users)
		.values({
			name: "Admin Teste Requests",
			email: `admin.requests.${suffix}@example.com`,
			cpf: `9${suffix}01`,
			phone: "85999999999",
			department: "QA",
			passwordHash,
			role: "admin",
		})
		.returning({ id: users.id });
	adminId = admin.id;

	const unauthorized = await api("GET", "/me/requests");
	expectStatus("GET /me/requests exige JWT", unauthorized, 401);

	const adminAuth = await api<AuthResponse>("POST", "/admin/auth", {
		body: { cpf: `9${suffix}01`, password: testPassword },
	});
	expectStatus("autenticação administrativa", adminAuth, 200);
	const adminToken = adminAuth.body.token;

	const driverABody = {
		name: "Motorista Teste A",
		email: `driver.a.${suffix}@example.com`,
		password: testPassword,
		cpf: `1${suffix}01`,
		cnh: `2${suffix}01`,
		phone: "85988888881",
		department: "QA",
		role: "driver",
	};
	const driverBBody = {
		...driverABody,
		name: "Motorista Teste B",
		email: `driver.b.${suffix}@example.com`,
		cpf: `1${suffix}02`,
		cnh: `2${suffix}02`,
		phone: "85988888882",
	};
	const driverA = await api<UserResponse>("POST", "/admin/users", {
		token: adminToken,
		body: driverABody,
	});
	expectStatus("criação do motorista A", driverA, 201);
	driverAId = driverA.body.id;
	const driverB = await api<UserResponse>("POST", "/admin/users", {
		token: adminToken,
		body: driverBBody,
	});
	expectStatus("criação do motorista B", driverB, 201);
	driverBId = driverB.body.id;

	const vehicle = await api<VehicleResponse>("POST", "/admin/vehicles", {
		token: adminToken,
		body: {
			plate: `QA-${suffix.slice(-4)}`,
			model: "Veículo Teste Requests",
			year: 2026,
			odometer: 10,
			imageUrl: null,
			status: "AVAILABLE",
			type: "CAR",
		},
	});
	expectStatus("criação do veículo", vehicle, 201);
	vehicleId = vehicle.body.id;

	const driverAAuth = await api<AuthResponse>("POST", "/auth", {
		body: { email: driverABody.email, password: testPassword },
	});
	expectStatus("autenticação do motorista A", driverAAuth, 200);
	const driverAToken = driverAAuth.body.token;
	const driverBAuth = await api<AuthResponse>("POST", "/auth", {
		body: { email: driverBBody.email, password: testPassword },
	});
	expectStatus("autenticação do motorista B", driverBAuth, 200);
	const driverBToken = driverBAuth.body.token;

	const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
	const end = new Date(start.getTime() + 60 * 60 * 1000);
	const requestBody = {
		vehicleId,
		predictedStartDate: start.toISOString(),
		predictedEndDate: end.toISOString(),
		destination: "Centro Administrativo",
		reason: "Teste de integração Docker",
	};

	const bodyWithUserId = await api("POST", "/me/requests", {
		token: driverAToken,
		body: { ...requestBody, userId: driverBId },
	});
	expectStatus("POST /me/requests rejeita userId", bodyWithUserId, 400);

	const invalidPeriod = await api("POST", "/me/requests", {
		token: driverAToken,
		body: {
			...requestBody,
			predictedStartDate: end.toISOString(),
			predictedEndDate: start.toISOString(),
		},
	});
	expectStatus(
		"POST /me/requests rejeita período inválido",
		invalidPeriod,
		400,
	);

	const created = await api<RequestResponse>("POST", "/me/requests", {
		token: driverAToken,
		body: requestBody,
	});
	expectStatus("POST /me/requests cria solicitação", created, 201);
	assert.equal(created.body.userId, driverAId);
	assert.equal(created.body.destination, requestBody.destination);
	assert.equal(created.body.vehicle?.id, vehicleId);
	assert.equal(created.body.passwordHash, undefined);

	const updatedDestination = "Centro Administrativo - Revisado";
	const updatedReason = "Teste de integração Docker atualizado";
	const updated = await api<RequestResponse>(
		"PATCH",
		`/me/requests/${created.body.id}`,
		{
			token: driverAToken,
			body: {
				destination: updatedDestination,
				reason: updatedReason,
			},
		},
	);
	expectStatus("PATCH /me/requests/:requestId edita pendente", updated, 200);
	assert.equal(updated.body.destination, updatedDestination);
	assert.equal(updated.body.reason, updatedReason);
	assert.equal(updated.body.vehicle?.id, vehicleId);

	const selfConflictEdit = await api<RequestResponse>(
		"PATCH",
		`/me/requests/${created.body.id}`,
		{
			token: driverAToken,
			body: {
				predictedStartDate: start.toISOString(),
				predictedEndDate: end.toISOString(),
			},
		},
	);
	expectStatus(
		"PATCH /me/requests/:requestId não conflita consigo mesma",
		selfConflictEdit,
		200,
	);

	const otherDriverEdit = await api(
		"PATCH",
		`/me/requests/${created.body.id}`,
		{
			token: driverBToken,
			body: { destination: "Tentativa indevida" },
		},
	);
	expectStatus(
		"PATCH /me/requests/:requestId isola motorista",
		otherDriverEdit,
		404,
	);

	const conflict = await api("POST", "/me/requests", {
		token: driverAToken,
		body: requestBody,
	});
	expectStatus("POST /me/requests detecta conflito", conflict, 400);

	const driverARequests = await api<RequestResponse[]>("GET", "/me/requests", {
		token: driverAToken,
	});
	expectStatus("GET /me/requests lista o motorista A", driverARequests, 200);
	assert(driverARequests.body.some((item) => item.id === created.body.id));
	assert(driverARequests.body.every((item) => item.userId === driverAId));
	assert(driverARequests.body.every((item) => item.passwordHash === undefined));

	const driverBRequests = await api<RequestResponse[]>("GET", "/me/requests", {
		token: driverBToken,
	});
	expectStatus("GET /me/requests isola o motorista B", driverBRequests, 200);
	assert(driverBRequests.body.every((item) => item.userId === driverBId));
	assert(!driverBRequests.body.some((item) => item.id === created.body.id));

	const secondStart = new Date(end.getTime() + 60 * 60 * 1000);
	const secondEnd = new Date(secondStart.getTime() + 60 * 60 * 1000);
	const legacyCreated = await api<RequestResponse>("POST", "/requests", {
		token: driverAToken,
		body: {
			...requestBody,
			userId: driverBId,
			predictedStartDate: secondStart.toISOString(),
			predictedEndDate: secondEnd.toISOString(),
		},
	});
	expectStatus("rota legada usa o motorista do JWT", legacyCreated, 201);
	assert.equal(legacyCreated.body.userId, driverAId);

	const legacyList = await api<RequestResponse[]>(
		"GET",
		`/requests/${driverBId}`,
		{ token: driverAToken },
	);
	expectStatus("rota legada não expõe outro motorista", legacyList, 200);
	assert(legacyList.body.every((item) => item.userId === driverAId));

	const adminRequests = await api<RequestResponse[]>("GET", "/admin/requests", {
		token: adminToken,
	});
	expectStatus("GET /admin/requests continua funcionando", adminRequests, 200);
	assert(adminRequests.body.every((item) => item.destination.length > 0));

	const vehicleRequests = await api<RequestResponse[]>(
		"GET",
		`/admin/requests/${vehicleId}`,
		{ token: adminToken },
	);
	expectStatus(
		"GET /admin/requests/:vehicleId continua funcionando",
		vehicleRequests,
		200,
	);
	assert(vehicleRequests.body.some((item) => item.id === created.body.id));

	const approved = await api<RequestResponse>(
		"PUT",
		`/admin/requests/${created.body.id}/approve`,
		{ token: adminToken },
	);
	expectStatus("aprovação administrativa continua funcionando", approved, 200);
	assert.equal(approved.body.destination, updatedDestination);

	const editApproved = await api("PATCH", `/me/requests/${created.body.id}`, {
		token: driverAToken,
		body: { destination: "Não deve alterar aprovada" },
	});
	expectStatus(
		"PATCH /me/requests/:requestId bloqueia aprovada",
		editApproved,
		400,
	);

	const trips = await api<TripResponse[]>("GET", "/me/trips", {
		token: driverAToken,
	});
	expectStatus("GET /me/trips lista viagem aprovada", trips, 200);
	const trip = trips.body.find((item) => item.requestId === created.body.id);
	assert(trip, "viagem aprovada não encontrada");

	const startedTrip = await api<TripResponse>(
		"PATCH",
		`/me/trips/${trip.id}/start`,
		{ token: driverAToken },
	);
	expectStatus(
		"PATCH /me/trips/:routeId/start inicia viagem",
		startedTrip,
		200,
	);
	assert.equal(startedTrip.body.routeStatus, "STARTED");
	assert.equal(startedTrip.body.vehicle.status, "IN_USE");

	const vehiclesInUse = await api<VehicleResponse[]>("GET", "/vehicles", {
		token: driverAToken,
	});
	expectStatus("GET /vehicles confirma veículo em uso", vehiclesInUse, 200);
	assert.equal(
		vehiclesInUse.body.find((item) => item.id === vehicleId)?.status,
		"IN_USE",
	);

	const invalidFinish = await api("PATCH", `/me/trips/${trip.id}/finish`, {
		token: driverAToken,
		body: {},
	});
	expectStatus(
		"PATCH /me/trips/:routeId/finish exige descrição",
		invalidFinish,
		400,
	);

	const finishedTrip = await api<TripResponse>(
		"PATCH",
		`/me/trips/${trip.id}/finish`,
		{
			token: driverAToken,
			body: { description: "Viagem finalizada pelo teste de integração" },
		},
	);
	expectStatus(
		"PATCH /me/trips/:routeId/finish finaliza viagem",
		finishedTrip,
		200,
	);
	assert.equal(finishedTrip.body.routeStatus, "FINISHED");
	assert.equal(finishedTrip.body.vehicle.status, "AVAILABLE");

	const vehiclesAvailable = await api<VehicleResponse[]>("GET", "/vehicles", {
		token: driverAToken,
	});
	expectStatus(
		"GET /vehicles confirma veículo disponível",
		vehiclesAvailable,
		200,
	);
	assert.equal(
		vehiclesAvailable.body.find((item) => item.id === vehicleId)?.status,
		"AVAILABLE",
	);

	const rejected = await api<RequestResponse>(
		"PUT",
		`/admin/requests/${legacyCreated.body.id}/reject`,
		{ token: adminToken },
	);
	expectStatus("rejeição administrativa continua funcionando", rejected, 200);
	assert.equal(rejected.body.destination, requestBody.destination);
}

run()
	.then(async () => {
		console.log("\nTodos os testes de requests passaram no Docker.");
		await cleanup();
		process.exit(0);
	})
	.catch(async (error) => {
		console.error("\nFalha nos testes de requests:", error);
		await cleanup();
		process.exit(1);
	});
