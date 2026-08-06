import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, Trash2, ArrowDownLeft, Wallet, Users, Star, AlertCircle, Clock, ShieldCheck, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore, type Notification } from '~/lib/notifications'
import { timeAgo } from '~/lib/utils'
import { playNotificationSound } from '~/lib/sound'

const iconMap: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  tip_received: { icon: ArrowDownLeft, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  tip_failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  withdrawal_completed: { icon: Wallet, color: 'text-accent', bg: 'bg-blue-50' },
  withdrawal_processing: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  withdrawal_failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  withdrawal_pin_set: { icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50' },
  team_joined: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  team_removed: { icon: Users, color: 'text-gray-400', bg: 'bg-gray-100' },
  feedback_received: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
}

function NotificationItem({ notification, onRead, onDelete }: {
  notification: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  const iconData = iconMap[notification.type] || { icon: Bell, color: 'text-gray-400', bg: 'bg-gray-50' }
  const Icon = iconData.icon

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className={`group relative flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
        notification.isRead ? 'hover:bg-gray-50' : 'bg-accent/[0.03] hover:bg-accent/[0.06]'
      }`}
      onClick={handleClick}
    >
      {!notification.isRead && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-accent" />
      )}

      <div className={`shrink-0 h-9 w-9 rounded-xl ${iconData.bg} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${iconData.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${notification.isRead ? 'text-gray-500' : 'font-semibold text-dark-text'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-gray-300 mt-1 font-medium">{timeAgo(notification.createdAt)}</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
        className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all self-start"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export default function NotificationPanel() {
  const { notifications, unreadCount, loading, panelOpen, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, deleteNotification, setPanelOpen } = useNotificationStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const prevUnreadRef = useRef<number | null>(null)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    // Play a sound when a brand-new unread notification arrives
    if (prevUnreadRef.current !== null && unreadCount > prevUnreadRef.current) {
      playNotificationSound()
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    if (panelOpen) {
      fetchNotifications()
    }
  }, [panelOpen, fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [panelOpen, setPanelOpen])

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="relative p-2 text-gray-400 hover:text-dark-text rounded-xl hover:bg-gray-100 transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-light"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-white rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-dark-text">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Read all
                  </button>
                )}
                <button onClick={() => setPanelOpen(false)} className="p-1.5 text-gray-300 hover:text-dark-text rounded-lg hover:bg-gray-100 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[400px]">
              {loading && notifications.length === 0 ? (
                <div className="py-12 flex justify-center">
                  <div className="h-6 w-6 border-2 border-gray-200 border-t-accent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-300 mt-1">When you receive tips or updates, they'll appear here.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
