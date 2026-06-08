import { Router } from 'express'
import { z } from 'zod'
import { signAccessToken } from '../auth/jwt.js'
import { USER_ROLES } from '../auth/roles.js'
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

authRouter.post('/auth/login', asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body)

  const authUser = 'password' in payload
    ? DEV_CREDENTIALS.find((entry) => (
      entry.email.toLowerCase() === payload.email.trim().toLowerCase()
      && entry.password === payload.password
    ))
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
