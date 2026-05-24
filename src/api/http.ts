import type { ProblemDetails } from './contracts'

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

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T
  }

  let problem: ProblemDetails | undefined
  try {
    problem = (await response.json()) as ProblemDetails
  } catch {
    problem = undefined
  }

  throw new ApiError(problem?.title ?? 'Request failed', response.status, problem)
}

export async function getJson<T>(url: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const response = await fetch(withQuery(url, query), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
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
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return parseResponse<TResponse>(response)
}

export async function patchJson<TResponse, TBody = unknown>(url: string, body: TBody): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return parseResponse<TResponse>(response)
}
