import type { User } from "@/domains/users/schema";
import type { TokenService } from "@/use-cases/token-service";

export function createAuthResponse(user: User, tokenService: TokenService) {
	const token = tokenService.sign({
		id: user.id,
		role: user.role,
	});

	return {
		token,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			photoUrl: user.photoUrl,
			role: user.role,
		},
	};
}
