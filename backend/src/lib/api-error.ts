export class ApiError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

export function badRequest(message: string) {
  return new ApiError(400, message)
}

export function notFound(message: string) {
  return new ApiError(404, message)
}

export function conflict(message: string) {
  return new ApiError(409, message)
}
