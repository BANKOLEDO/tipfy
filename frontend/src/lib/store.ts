import { create } from 'zustand'
import { api } from '~/lib/api'

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  location: string | null
  isBusiness: boolean
  businessName: string | null
  businessCategory: string | null
  totalTipsReceived: number
  totalAmount: number
  rating: number
  hasWithdrawalPin?: boolean
  isVerified: boolean
  role: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  initializing: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
  hydrateAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  initializing: true,
  setAuth: (user, token) => {
    localStorage.setItem('tipfy_token', token)
    set({ user, token, isAuthenticated: true, initializing: false })
  },
  clearAuth: () => {
    localStorage.removeItem('tipfy_token')
    set({ user: null, token: null, isAuthenticated: false, initializing: false })
  },
  updateUser: (partial) =>
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
  hydrateAuth: async () => {
    const token = localStorage.getItem('tipfy_token')
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, initializing: false })
      return
    }
    try {
      const data = await api<{ user: User | null }>('/auth/me')
      if (data?.user) {
        set({ user: data.user, token, isAuthenticated: true, initializing: false })
      } else {
        localStorage.removeItem('tipfy_token')
        set({ user: null, token: null, isAuthenticated: false, initializing: false })
      }
    } catch {
      localStorage.removeItem('tipfy_token')
      set({ user: null, token: null, isAuthenticated: false, initializing: false })
    }
  },
}))

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface UIState {
  sidebarOpen: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
