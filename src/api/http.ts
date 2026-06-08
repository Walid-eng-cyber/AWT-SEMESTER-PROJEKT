type TokenStorage = 'local' | 'session'

const ACCESS_TOKEN_KEY = 'awt_access_token'

export async function postJson<TResponse, TBody>(url: string, body: TBody): Promise<TResponse> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach backend API. Please make sure backend runs on port 4000.')
  }

  let payload: unknown = null
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    payload = await response.json()
  } else {
    const text = await response.text()
    payload = text || null
  }

  if (!response.ok) {
    if (payload && typeof payload === 'object') {
      const maybeMessage = (payload as { message?: unknown }).message
      if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
        throw new Error(maybeMessage)
      }
    }

    throw new Error(`Request failed (${response.status}).`)
  }

  return payload as TResponse
}

export function setAccessToken(token: string, storage: TokenStorage) {
  if (storage === 'local') {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    return
  }

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}
