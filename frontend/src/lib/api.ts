const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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
  return localStorage.getItem('tipfy_token')
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

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(data.error?.message || 'An error occurred', response.status, data.error?.code || 'UNKNOWN')
  }

  return data.data || data
}

export function setToken(token: string) { localStorage.setItem('tipfy_token', token) }
export function clearToken() { localStorage.removeItem('tipfy_token') }
