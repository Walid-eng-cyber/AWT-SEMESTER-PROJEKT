import { z } from 'zod'
import type { AuthenticatedUser, UserRole } from '../auth/types.js'
import { prisma } from '../db/client.js'
import { notFound } from '../lib/api-error.js'

type UserStatus = 'active' | 'blocked'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
}

export const updateMeSchema = z.object({
  fullName: z.string().min(2).max(120),
})

export const adminUserUpdateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  role: z.enum(['student', 'staff', 'admin']).optional(),
  status: z.enum(['active', 'blocked']).optional(),
}).refine(value => Object.keys(value).length > 0, 'At least one field is required for update.')

function inferNameFromEmail(email: string) {
  const [localPart] = email.split('@')
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()
  if (!normalized) return 'User'

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(segment => segment[0].toUpperCase() + segment.slice(1))
    .join(' ')
}

function parseRole(role: string): UserRole {
  if (role === 'student' || role === 'staff' || role === 'admin') return role
  return 'student'
}

function parseStatus(status: string): UserStatus {
  if (status === 'active' || status === 'blocked') return status
  return 'active'
}

function toProfile(user: {
  id: string
  email: string
  fullName: string
  role: string
  status: string
}): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: parseRole(user.role),
    status: parseStatus(user.status),
  }
}

async function upsertFromAuth(auth: AuthenticatedUser) {
  const email = auth.email ?? `${auth.id}@local.invalid`
  const user = await prisma.user.upsert({
    where: { id: auth.id },
    create: {
      id: auth.id,
      email,
      fullName: inferNameFromEmail(email),
      role: auth.role,
      status: 'active',
    },
    update: {
      role: auth.role,
      email,
    },
  })

  return toProfile(user)
}

export async function ensureUserFromAuth(auth: AuthenticatedUser) {
  return upsertFromAuth(auth)
}

export async function getMyProfile(auth: AuthenticatedUser) {
  return await upsertFromAuth(auth)
}

export async function updateMyProfile(auth: AuthenticatedUser, input: z.infer<typeof updateMeSchema>) {
  await upsertFromAuth(auth)
  const updated = await prisma.user.update({
    where: { id: auth.id },
    data: { fullName: input.fullName },
  })
  return toProfile(updated)
}

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { email: 'asc' } })
  return users.map(toProfile)
}

export async function getUserById(userId: string) {
  const item = await prisma.user.findUnique({ where: { id: userId } })
  if (!item) throw notFound(`User ${userId} not found.`)
  return toProfile(item)
}

export async function updateUserById(userId: string, input: z.infer<typeof adminUserUpdateSchema>) {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) throw notFound(`User ${userId} not found.`)

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: input.fullName,
      role: input.role,
      status: input.status,
    },
  })

  return toProfile(updated)
}
