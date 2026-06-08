import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { UserRole } from '../auth/types.js'

interface AccessTokenPayload extends JwtPayload {
  sub: string
  role: UserRole
  email?: string
}

function extractBearerToken(header?: string) {
  if (!header) return null

  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

function getJwtSecret() {
  return process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me'
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'student' || value === 'staff' || value === 'admin'
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.header('authorization'))
  if (!token) {
    return res.status(401).json({
      type: 'auth_error',
      message: 'Missing or invalid Authorization header.',
    })
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (typeof decoded === 'string') {
      return res.status(401).json({
        type: 'auth_error',
        message: 'Invalid token payload.',
      })
    }

    const payload = decoded as AccessTokenPayload
    if (!payload.sub || !isUserRole(payload.role)) {
      return res.status(401).json({
        type: 'auth_error',
        message: 'Token is missing required claims.',
      })
    }

    req.auth = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    }

    return next()
  } catch {
    return res.status(401).json({
      type: 'auth_error',
      message: 'Invalid or expired token.',
    })
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role
    if (!role) {
      return res.status(401).json({
        type: 'auth_error',
        message: 'Authentication required.',
      })
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        type: 'forbidden',
        message: 'Insufficient role for this operation.',
      })
    }

    return next()
  }
}
