import { create } from 'zustand'
import { api } from '~/lib/api'

interface AdminUser {
  id: string
  email: string
  username: string
  displayName: string
  role: string
  isBusiness: boolean
}

interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  initializing: boolean
  setAuth: (user: AdminUser, token: string) => void
  clearAuth: () => void
  hydrateAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  initializing: true,
  setAuth: (user, token) => {
    localStorage.setItem('tipfy_admin_token', token)
    set({ user, token, isAuthenticated: true, initializing: false })
  },
  clearAuth: () => {
    localStorage.removeItem('tipfy_admin_token')
    set({ user: null, token: null, isAuthenticated: false, initializing: false })
  },
  hydrateAuth: async () => {
    const token = localStorage.getItem('tipfy_admin_token')
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, initializing: false })
      return
    }
    try {
      const data = await api<{ user: AdminUser | null }>('/auth/me')
      if (data?.user && (data.user.role === 'admin' || data.user.role === 'support')) {
        set({ user: data.user, token, isAuthenticated: true, initializing: false })
      } else {
        localStorage.removeItem('tipfy_admin_token')
        set({ user: null, token: null, isAuthenticated: false, initializing: false })
      }
    } catch {
      localStorage.removeItem('tipfy_admin_token')
      set({ user: null, token: null, isAuthenticated: false, initializing: false })
    }
  },
}))

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface UIState {
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
