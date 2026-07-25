import { Link, useLocation, Outlet } from 'react-router-dom'
import { Home, ArrowDownLeft, Wallet, Users, Settings, LogOut, X, ChevronLeft } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { useAuthStore, useUIStore } from '~/lib/store'
import { api } from '~/lib/api'
import { Avatar } from '~/components/ui/Avatar'
import { AnimatePresence, motion } from 'framer-motion'
import NotificationPanel from '~/components/NotificationPanel'

const navItems = [
  { label: 'Home', path: '/dashboard', icon: Home },
  { label: 'Tips', path: '/dashboard/tips', icon: ArrowDownLeft },
  { label: 'Withdraw', path: '/dashboard/withdraw', icon: Wallet },
  { label: 'Team', path: '/dashboard/team', icon: Users },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
]

function Sidebar() {
  const location = useLocation()
  const { user, clearAuth } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-white/90 backdrop-blur-xl border-r border-gray-200/60 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-5 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
              <NairaCoinIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-dark-text">tipfy</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-dark-text hover:bg-gray-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
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
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
            <Avatar name={user?.displayName || 'User'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-text truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
            </div>
          </div>
          <button onClick={() => { api('/auth/logout').catch(() => {}); clearAuth(); window.location.href = '/login' }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 mt-1">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </div>
      </aside>
    </>
  )
}

function TopNav() {
  const { toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-30 h-14 bg-light/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-4 gap-3">
      <button onClick={toggleSidebar} className="lg:hidden p-1.5 -ml-1 text-gray-400 hover:text-dark-text rounded-lg hover:bg-gray-100 transition-all">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <Link to="/dashboard" className="hidden lg:flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center">
          <NairaCoinIcon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-dark-text">tipfy</span>
      </Link>
      <div className="flex-1" />
      <NotificationPanel />
      <Link to="/dashboard/settings" className="p-0.5 rounded-xl hover:bg-gray-100 transition-all">
        <Avatar name={user?.displayName || 'User'} size="sm" />
      </Link>
    </header>
  )
}

function MobileBottomBar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 lg:hidden">
      <div className="flex items-center justify-around h-[68px] px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          return (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive ? 'text-accent' : 'text-gray-400'
              }`}>
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-accent/10' : ''}`}>
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div layoutId="bottom-tab" className="h-0.5 w-4 bg-accent rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-light pattern-dots-dark">
      <Sidebar />
      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <MobileBottomBar />
      </div>
    </div>
  )
}
