export const USER_ROLES = ["driver", "admin"] as const;
export type UserRoles = (typeof USER_ROLES)[number];
