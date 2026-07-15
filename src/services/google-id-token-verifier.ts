import { createPublicKey, verify } from "node:crypto";
import {
	GoogleTokenVerificationUnavailableError,
	InvalidGoogleTokenError,
} from "@/domains/users/errors";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set([
	"accounts.google.com",
	"https://accounts.google.com",
]);

type FetchResponse = {
	ok: boolean;
	headers: {
		get(name: string): string | null;
	};
	json(): Promise<unknown>;
};

type FetchFunction = (url: string) => Promise<FetchResponse>;

type GoogleJwk = {
	alg?: string;
	e: string;
	kid: string;
	kty: string;
	n: string;
	use?: string;
};

type GoogleJwksResponse = {
	keys?: GoogleJwk[];
};

type RawGoogleIdTokenPayload = {
	aud?: unknown;
	email?: unknown;
	email_verified?: unknown;
	exp?: unknown;
	iss?: unknown;
	name?: unknown;
	picture?: unknown;
	sub?: unknown;
};

type GoogleIdTokenHeader = {
	alg?: unknown;
	kid?: unknown;
};

export type GoogleIdTokenPayload = {
	audience: string | string[];
	email: string;
	emailVerified: boolean;
	expiresAt: number;
	issuer: string;
	name?: string;
	picture?: string;
	sub: string;
};

export interface GoogleIdTokenVerifier {
	verify(idToken: string, audiences: string[]): Promise<GoogleIdTokenPayload>;
}

export class GoogleJwtIdTokenVerifier implements GoogleIdTokenVerifier {
	private cachedKeys: { expiresAt: number; keys: GoogleJwk[] } | null = null;

	constructor(
		private readonly fetchFn: FetchFunction = fetch,
		private readonly now: () => number = Date.now,
	) {}

	async verify(
		idToken: string,
		audiences: string[],
	): Promise<GoogleIdTokenPayload> {
		const token = decodeToken(idToken);

		if (token.header.alg !== "RS256" || typeof token.header.kid !== "string") {
			throw new InvalidGoogleTokenError();
		}

		let key = await this.findKey(token.header.kid);

		if (!key) {
			key = await this.findKey(token.header.kid, true);
		}

		if (!key) {
			throw new InvalidGoogleTokenError();
		}

		const publicKey = createPublicKey({
			format: "jwk",
			key,
		} as Parameters<typeof createPublicKey>[0]);
		const isSignatureValid = verify(
			"RSA-SHA256",
			Buffer.from(token.signingInput),
			publicKey,
			token.signature,
		);

		if (!isSignatureValid) {
			throw new InvalidGoogleTokenError();
		}

		return assertGoogleIdTokenPayload(
			token.payload,
			audiences,
			Math.floor(this.now() / 1000),
		);
	}

	private async findKey(kid: string, forceRefresh = false) {
		const keys = await this.getKeys(forceRefresh);
		return keys.find((key) => key.kid === kid);
	}

	private async getKeys(forceRefresh: boolean) {
		if (
			!forceRefresh &&
			this.cachedKeys &&
			this.cachedKeys.expiresAt > this.now()
		) {
			return this.cachedKeys.keys;
		}

		const response = await this.fetchFn(GOOGLE_JWKS_URL);

		if (!response.ok) {
			throw new GoogleTokenVerificationUnavailableError();
		}

		const body = (await response.json()) as GoogleJwksResponse;

		if (!Array.isArray(body.keys)) {
			throw new GoogleTokenVerificationUnavailableError();
		}

		this.cachedKeys = {
			expiresAt:
				this.now() + getCacheMaxAge(response.headers.get("cache-control")),
			keys: body.keys,
		};

		return this.cachedKeys.keys;
	}
}

export const googleIdTokenVerifier = new GoogleJwtIdTokenVerifier();

export function assertGoogleIdTokenPayload(
	payload: RawGoogleIdTokenPayload,
	audiences: string[],
	nowInSeconds: number,
): GoogleIdTokenPayload {
	if (typeof payload.iss !== "string" || !GOOGLE_ISSUERS.has(payload.iss)) {
		throw new InvalidGoogleTokenError();
	}

	if (!isAudienceAllowed(payload.aud, audiences)) {
		throw new InvalidGoogleTokenError();
	}

	if (typeof payload.exp !== "number" || payload.exp <= nowInSeconds) {
		throw new InvalidGoogleTokenError();
	}

	if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
		throw new InvalidGoogleTokenError();
	}

	if (typeof payload.email !== "string" || payload.email.trim().length === 0) {
		throw new InvalidGoogleTokenError();
	}

	return {
		audience: payload.aud as string | string[],
		email: payload.email,
		emailVerified:
			payload.email_verified === true || payload.email_verified === "true",
		expiresAt: payload.exp,
		issuer: payload.iss,
		name: typeof payload.name === "string" ? payload.name : undefined,
		picture: typeof payload.picture === "string" ? payload.picture : undefined,
		sub: payload.sub,
	};
}

function decodeToken(idToken: string) {
	const parts = idToken.split(".");

	if (parts.length !== 3) {
		throw new InvalidGoogleTokenError();
	}

	const [encodedHeader, encodedPayload, encodedSignature] = parts;

	if (!encodedHeader || !encodedPayload || !encodedSignature) {
		throw new InvalidGoogleTokenError();
	}

	return {
		header: decodeJsonPart<GoogleIdTokenHeader>(encodedHeader),
		payload: decodeJsonPart<RawGoogleIdTokenPayload>(encodedPayload),
		signature: decodeBase64Url(encodedSignature),
		signingInput: `${encodedHeader}.${encodedPayload}`,
	};
}

function decodeJsonPart<T>(value: string): T {
	try {
		return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
	} catch {
		throw new InvalidGoogleTokenError();
	}
}

function decodeBase64Url(value: string) {
	try {
		return Buffer.from(value, "base64url");
	} catch {
		throw new InvalidGoogleTokenError();
	}
}

function getCacheMaxAge(cacheControl: string | null) {
	const oneHourInMs = 60 * 60 * 1000;

	if (!cacheControl) {
		return oneHourInMs;
	}

	const match = cacheControl.match(/max-age=(\d+)/);

	if (!match?.[1]) {
		return oneHourInMs;
	}

	return Number(match[1]) * 1000;
}

function isAudienceAllowed(aud: unknown, audiences: string[]) {
	if (typeof aud === "string") {
		return audiences.includes(aud);
	}

	if (Array.isArray(aud)) {
		return aud.some(
			(value) => typeof value === "string" && audiences.includes(value),
		);
	}

	return false;
}
