import type { ProblemDetails } from './contracts'
import type { UserRole } from './contracts'

type TokenPersistence = 'local' | 'session'

const TOKEN_STORAGE_KEY = 'awt_access_token'
let inMemoryToken: string | null = null

export interface AccessTokenClaims {
  sub: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
}

inMemoryToken = readStoredToken()

export function setAccessToken(token: string, persistence: TokenPersistence = 'local') {
  inMemoryToken = token
  if (typeof window === 'undefined') return

  if (persistence === 'local') {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function clearAccessToken() {
  inMemoryToken = null
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function getAccessToken() {
  if (inMemoryToken) return inMemoryToken
  inMemoryToken = readStoredToken()
  return inMemoryToken
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'student' || value === 'staff' || value === 'admin'
}

export function getAccessTokenClaims(): AccessTokenClaims | null {
  const token = getAccessToken()
  if (!token) return null

  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const payloadRaw = decodeBase64Url(parts[1])
    const payload = JSON.parse(payloadRaw) as Partial<AccessTokenClaims>

    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || !isUserRole(payload.role)) {
      return null
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ProblemDetails

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

function withQuery(url: string, query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return url

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

function withAuthHeaders(headers?: Record<string, string>) {
  const token = getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T
  }

  let problem: ProblemDetails | undefined
  let fallbackMessage: string | undefined
  try {
    const parsed = (await response.json()) as ProblemDetails & { message?: string; error?: string }
    problem = parsed
    fallbackMessage = parsed.title ?? parsed.detail ?? parsed.message ?? parsed.error
  } catch {
    problem = undefined
    fallbackMessage = undefined
  }

  throw new ApiError(problem?.title ?? fallbackMessage ?? 'Request failed', response.status, problem)
}

export async function getJson<T>(url: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const response = await fetch(withQuery(url, query), {
    method: 'GET',
    headers: withAuthHeaders(),
  })

  return parseResponse<T>(response)
}

export async function postJson<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  headers?: Record<string, string>,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: withAuthHeaders(headers),
    body: body ? JSON.stringify(body) : undefined,
  })

  return parseResponse<TResponse>(response)
}

export async function patchJson<TResponse, TBody = unknown>(url: string, body: TBody): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: withAuthHeaders(),
    body: JSON.stringify(body),
  })

  return parseResponse<TResponse>(response)
}
