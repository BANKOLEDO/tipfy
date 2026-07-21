import { create } from 'zustand'

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
  isVerified: boolean
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem('tipfy_token', token)
    set({ user, token, isAuthenticated: true })
  },
  clearAuth: () => {
    localStorage.removeItem('tipfy_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
  updateUser: (partial) =>
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
}))

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
