import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

function derive(password: string, salt: string) {
  return scryptSync(password, salt, KEY_LENGTH)
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = derive(password, salt).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedValue: string): boolean {
  const [salt, expectedHash] = storedValue.split(':')
  if (!salt || !expectedHash) return false

  const actualHash = derive(password, salt)
  const expectedBuffer = Buffer.from(expectedHash, 'hex')

  if (actualHash.length !== expectedBuffer.length) return false
  return timingSafeEqual(actualHash, expectedBuffer)
}
