// Relative by default so the same build works behind the Vite dev proxy
// (frontend/vite.config.ts) and the Vercel /api rewrite. An absolute
// localhost default would ship to production and break every request.
const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

const TOKEN_KEY = 'tipfy_token'
const LOGIN_PATH = '/login'

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options
  const token = getToken()

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }
  if (token) requestHeaders['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  // 204 No Content has no body; response.json() would throw on it.
  const text = await response.text()
  let data: any = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    // Only bounce to login when we actually held a token, so an expired
    // session recovers instead of leaving every page silently empty. Guests
    // (no token) are left alone so public pages keep working.
    if (response.status === 401 && token) {
      clearToken()
      if (!window.location.pathname.startsWith(LOGIN_PATH)) {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.assign(`${LOGIN_PATH}?next=${next}`)
      }
    }
    throw new ApiError(
      data?.error?.message || `Request failed (${response.status})`,
      response.status,
      data?.error?.code || 'UNKNOWN'
    )
  }

  // `data.data ?? data` would swallow a legitimate null/false payload.
  return (data && typeof data === 'object' && 'data' in data ? data.data : data) as T
}

export function setToken(token: string) { localStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }
