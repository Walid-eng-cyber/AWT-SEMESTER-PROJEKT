import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { signAccessToken } from '../auth/jwt.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { USER_ROLES } from '../auth/roles.js'
import { prisma } from '../db/client.js'
import { asyncHandler } from '../lib/async-handler.js'

const legacyLoginSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  role: z.enum([...USER_ROLES]),
})

const credentialsLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const loginSchema = z.union([legacyLoginSchema, credentialsLoginSchema])

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
})

const DEV_CREDENTIALS = [
  {
    userId: 'student.demo',
    email: 'student@hs-mainz.de',
    role: 'student' as const,
    password: 'Student123!',
  },
  {
    userId: 'staff.demo',
    email: 'staff@hs-mainz.de',
    role: 'staff' as const,
    password: 'Staff123!',
  },
  {
    userId: 'admin.demo',
    email: 'admin@hs-mainz.de',
    role: 'admin' as const,
    password: 'Admin123!',
  },
]

export const authRouter = Router()

authRouter.post('/auth/register', asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body)
  const normalizedEmail = payload.email.trim().toLowerCase()

  if (DEV_CREDENTIALS.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({
      type: 'auth_error',
      message: 'This email is reserved for demo accounts. Please use another email.',
    })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    res.status(409).json({
      type: 'auth_error',
      message: 'An account with this email already exists.',
    })
    return
  }

  const user = await prisma.user.create({
    data: {
      id: `student-${randomUUID()}`,
      email: normalizedEmail,
      fullName: payload.fullName.trim(),
      role: 'student',
      status: 'active',
      passwordHash: hashPassword(payload.password),
    },
  })

  res.status(201).json({
    message: 'Account created successfully.',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  })
}))

authRouter.post('/auth/login', asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body)

  const authUser = 'password' in payload
    ? await (async () => {
      const normalizedEmail = payload.email.trim().toLowerCase()
      const devUser = DEV_CREDENTIALS.find((entry) => (
        entry.email.toLowerCase() === normalizedEmail && entry.password === payload.password
      ))
      if (devUser) {
        return {
          userId: devUser.userId,
          email: devUser.email,
          role: devUser.role,
        }
      }

      const persistedUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (!persistedUser?.passwordHash || !verifyPassword(payload.password, persistedUser.passwordHash)) {
        return null
      }

      if (!USER_ROLES.includes(persistedUser.role as (typeof USER_ROLES)[number])) {
        return null
      }

      return {
        userId: persistedUser.id,
        email: persistedUser.email,
        role: persistedUser.role as (typeof USER_ROLES)[number],
      }
    })()
    : {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }

  if (!authUser) {
    res.status(401).json({
      type: 'auth_error',
      message: 'Invalid email or password.',
    })
    return
  }

  const accessToken = signAccessToken({
    sub: authUser.userId,
    email: authUser.email,
    role: authUser.role,
  })

  res.status(200).json({
    tokenType: 'Bearer',
    accessToken,
    expiresIn: 3600,
    user: {
      id: authUser.userId,
      email: authUser.email,
      role: authUser.role,
    },
  })
}))
