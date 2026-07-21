import { create } from 'zustand'
import { api } from '~/lib/api'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  link: string | null
  data: any
  isRead: boolean
  createdAt: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  panelOpen: boolean
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  setPanelOpen: (open: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  panelOpen: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const data = await api<any>('/notifications')
      set({
        notifications: data.notifications || [],
        unreadCount: data.unreadCount ?? get().unreadCount,
      })
    } catch { /* noop */ } finally { set({ loading: false }) }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await api<any>('/notifications/unread-count')
      set({ unreadCount: data.count ?? 0 })
    } catch { /* noop */ }
  },

  markAsRead: async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' })
      set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }))
    } catch { /* noop */ }
  },

  markAllAsRead: async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' })
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))
    } catch { /* noop */ }
  },

  deleteNotification: async (id: string) => {
    try {
      await api(`/notifications/${id}`, { method: 'DELETE' })
      set((s) => {
        const target = s.notifications.find((n) => n.id === id)
        return {
          notifications: s.notifications.filter((n) => n.id !== id),
          unreadCount: target && !target.isRead ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
        }
      })
    } catch { /* noop */ }
  },

  setPanelOpen: (open) => set({ panelOpen: open }),
}))
