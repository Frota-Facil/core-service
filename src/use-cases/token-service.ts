import type { UserRoles } from "@/domains/users/roles";

export interface TokenService {
	sign(payload: { id: string; cpf: string; role: UserRoles }): string;

	verify(token: string): {
		id: string;
		cpf: string;
		role: UserRoles;
	};
}
