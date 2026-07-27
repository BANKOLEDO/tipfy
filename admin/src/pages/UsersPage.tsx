import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Ban, CheckCircle, Eye, UserCog, Users, TrendingUp, Shield, ArrowUpRight } from 'lucide-react'
import { api, ApiError } from '~/lib/api'
import { formatNaira, timeAgo, getInitials } from '~/lib/utils'
import { useUIStore } from '~/lib/store'
import Pagination from '~/components/Pagination'
import TableSkeleton from '~/components/TableSkeleton'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface User {
  id: string; email: string; username: string; displayName: string; role: string
  isBusiness: boolean; businessName: string | null; isVerified: boolean; isActive: boolean
  totalTipsReceived: number; totalAmount: number; rating: number
  lastLoginAt: string | null; createdAt: string
}

interface UserDetail extends User {
  bio: string | null; location: string | null; businessCategory: string | null
}

interface Paged { users: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

function UserDetailModal({ user, onClose, onAction }: { user: UserDetail; onClose: () => void; onAction: () => void }) {
  const [loading, setLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const toggleActive = async () => {
    setLoading(true)
    try {
      const res = await api<{ isActive: boolean }>(`/admin/users/${user.id}/toggle-active`, { method: 'POST' })
      addToast('success', res.isActive ? 'User activated' : 'User deactivated')
      onAction(); onClose()
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Failed')
    }
    setLoading(false)
  }

  const changeRole = async (role: string) => {
    setLoading(true)
    try {
      await api(`/admin/users/${user.id}/role`, { method: 'POST', body: { role } })
      addToast('success', `Role changed to ${role}`)
      onAction(); onClose()
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Failed')
    }
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-lg bg-white rounded-3xl border border-gray-200/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-accent to-blue-600 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
              {getInitials(user.displayName)}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.displayName}</h2>
              <p className="text-sm text-white/70">@{user.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/20">{user.role}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.isActive ? 'bg-emerald-400/25 text-emerald-100' : 'bg-red-400/25 text-red-100'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tips Received', value: user.totalTipsReceived, color: 'text-blue-600 bg-blue-50' },
              { label: 'Balance', value: formatNaira(user.totalAmount), color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Rating', value: user.rating > 0 ? `${Number(user.rating).toFixed(1)} ★` : '—', color: 'text-amber-600 bg-amber-50' },
              { label: 'Joined', value: timeAgo(user.createdAt), color: 'text-purple-600 bg-purple-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-3`}>
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{s.label}</p>
                <p className="text-sm font-bold mt-0.5 font-mono-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 bg-gray-50 rounded-xl p-3">
            {[
              { label: 'Email', value: user.email },
              ...(user.businessName ? [{ label: 'Business', value: user.businessName }] : []),
              ...(user.bio ? [{ label: 'Bio', value: user.bio }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{row.label}</span>
                <span className="font-medium text-dark-text text-right max-w-[220px] truncate">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {user.role !== 'admin' && (
              <>
                <button onClick={toggleActive} disabled={loading}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${
                    user.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100 border border-emerald-100'
                  }`}>
                  {user.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
                {user.role === 'user' && (
                  <button onClick={() => changeRole('support')} disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition-all active:scale-[0.97]">
                    <UserCog className="h-3.5 w-3.5" />Make Support
                  </button>
                )}
                {user.role === 'support' && (
                  <button onClick={() => changeRole('user')} disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all active:scale-[0.97]">
                    <UserCog className="h-3.5 w-3.5" />Remove Support
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function UsersPage() {
  const [data, setData] = useState<Paged | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const addToast = useUIStore((s) => s.addToast)

  const fetchUsers = useCallback(async (p = 1, q = search) => {
    setLoading(true)
    try {
      const res = await api<Paged>(`/admin/users?page=${p}&limit=20&search=${encodeURIComponent(q)}`)
      setData(res)
    } catch { /* ignore */ }
    setLoading(false)
  }, [search])

  useEffect(() => { fetchUsers(page) }, [page, fetchUsers])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchUsers(1, search) }

  const viewUser = async (userId: string) => {
    try {
      const res = await api<{ user: UserDetail }>(`/admin/users/${userId}`)
      setSelectedUser(res.user)
    } catch { addToast('error', 'Failed to load user details') }
  }

  const users = data?.users || []
  const p = data?.pagination

  return (
    <motion.div variants={{ visible: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-accent text-xs font-semibold uppercase tracking-wider">Manage</p>
        <h1 className="text-2xl font-black text-dark-text mt-0.5">Users</h1>
        <p className="text-sm text-gray-400 mt-0.5">View and manage platform users</p>
      </motion.div>

      {/* Stats Bar */}
      {p && (
        <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
          {[
            { label: 'Total Users', value: p.total.toLocaleString(), icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { label: 'Active', value: users.filter(u => u.isActive).length.toLocaleString(), icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length.toLocaleString(), icon: Shield, color: 'bg-purple-50 text-purple-600 border-purple-100' },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${s.color} text-xs font-semibold`}>
              <s.icon className="h-3.5 w-3.5" />
              <span className="font-mono-nums">{s.value}</span>
              <span className="opacity-60 font-medium">{s.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      <motion.form variants={fadeUp} onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, username..."
            className="neo-input w-full h-12 pl-11 pr-4 text-sm" />
        </div>
        <button type="submit" className="h-12 px-6 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover active:scale-[0.97] transition-all shadow-md shadow-blue-500/20">Search</button>
      </motion.form>

      {loading && !data ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['User', 'Role', 'Balance', 'Tips', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-blue-500/15">
                          {getInitials(u.displayName)}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-text group-hover:text-accent transition-colors">{u.displayName}</p>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                        u.role === 'admin' ? 'bg-accent/10 text-accent border border-accent/20' :
                        u.role === 'support' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono-nums font-bold text-dark-text">{formatNaira(u.totalAmount)}</td>
                    <td className="px-5 py-3.5 font-mono-nums text-gray-500">{u.totalTipsReceived}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                        u.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{timeAgo(u.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => viewUser(u.id)}
                        className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-all" title="View details">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16">
                    <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No users found</p>
                    <p className="text-xs text-gray-300 mt-1">Try a different search term</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {p && <Pagination page={p.page} totalPages={p.totalPages} total={p.total} label="users" onPageChange={setPage} />}

      <AnimatePresence>
        {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onAction={() => fetchUsers(page)} />}
      </AnimatePresence>
    </motion.div>
  )
}
