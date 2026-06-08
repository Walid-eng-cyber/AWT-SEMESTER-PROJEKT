import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { UserRole } from './types.js'

export interface AuthClaims {
  sub: string
  email: string
  role: UserRole
}

const TOKEN_TTL_SECONDS = 60 * 60

export function signAccessToken(claims: AuthClaims) {
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_TTL_SECONDS,
  })
}

export function verifyAccessToken(token: string): AuthClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET)

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.email !== 'string' ||
    typeof decoded.role !== 'string'
  ) {
    throw new Error('Invalid token claims.')
  }

  const role = decoded.role
  if (role !== 'student' && role !== 'staff' && role !== 'admin') {
    throw new Error('Invalid role in token.')
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    role: role as UserRole,
  }
}
