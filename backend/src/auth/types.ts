export type UserRole = 'student' | 'staff' | 'admin'

export interface AuthenticatedUser {
  id: string
  role: UserRole
  email?: string
}
