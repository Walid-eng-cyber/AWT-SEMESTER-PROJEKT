import type { PagedResponse, UpdateUserRequest, User } from '../contracts'
import { endpoints } from '../endpoints'
import { getJson, patchJson } from '../http'

export function getCurrentUser(): Promise<User> {
  return getJson<User>(endpoints.users.me)
}

export function updateCurrentUser(input: UpdateUserRequest): Promise<User> {
  return patchJson<User, UpdateUserRequest>(endpoints.users.me, input)
}

export function listUsers(page = 1, pageSize = 20): Promise<PagedResponse<User>> {
  return getJson<PagedResponse<User>>(endpoints.users.list, { page, pageSize })
}
