import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import { LayoutDashboard, Users, ArrowDownLeft, Wallet, Shield, FileText, Activity, LogOut, X, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '~/lib/store'
import { api } from '~/lib/api'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { getInitials } from '~/lib/utils'

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Tips', path: '/admin/tips', icon: ArrowDownLeft },
  { label: 'Withdrawals', path: '/admin/withdrawals', icon: Wallet },
  { label: 'Fraud', path: '/admin/fraud', icon: Shield },
  { label: 'Audit Logs', path: '/admin/audit', icon: FileText },
  { label: 'System', path: '/admin/system', icon: Activity },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()
  const { user, clearAuth } = useAuthStore()

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-white/90 backdrop-blur-xl border-r border-gray-200/60 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-5 pb-4">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
              <NairaCoinIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-dark-text">tipfy</span>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">ADMIN</span>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-dark-text hover:bg-gray-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path} onClick={onClose}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-500 hover:text-dark-text hover:bg-gray-50'
                }`}>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-accent/15' : 'bg-gray-100 group-hover:bg-gray-200/70'}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-200/60">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.displayName || 'A')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-text truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { api('/auth/logout').catch(() => {}); clearAuth(); window.location.href = '/admin/login' }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 mt-1">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </div>
      </aside>
    </>
  )
}

function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-light/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-4 gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 -ml-1 text-gray-400 hover:text-dark-text rounded-lg hover:bg-gray-100 transition-all">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <Link to="/admin" className="hidden lg:flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center">
          <NairaCoinIcon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-dark-text">Admin Panel</span>
      </Link>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
      </div>
    </header>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-screen bg-light pattern-dots-dark">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
