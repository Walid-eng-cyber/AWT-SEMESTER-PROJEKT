export const USER_ROLES = ['student', 'staff', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]
