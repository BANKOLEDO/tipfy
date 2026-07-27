import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira, timeAgo } from '~/lib/utils'
import { useUIStore } from '~/lib/store'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface Withdrawal {
  id: string; amount: number; status: string; bankName: string; accountNumber: string
  accountName: string; reference: string; failureReason: string | null
  createdAt: string; processedAt: string | null
  user: { id: string; username: string; displayName: string; email: string }
}

interface Paged { withdrawals: Withdrawal[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  processing: 'bg-blue-50 text-blue-600 border border-blue-100',
  failed: 'bg-red-50 text-red-600 border border-red-100',
}

export default function WithdrawalsPage() {
  const [data, setData] = useState<Paged | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const addToast = useUIStore((s) => s.addToast)

  const fetchAll = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      setData(await api<Paged>(`/admin/withdrawals?${params}`))
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchAll(page) }, [page, status])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchAll(1) }
  const withdrawals = data?.withdrawals || []
  const p = data?.pagination

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Monitor</p>
        <h1 className="text-xl font-bold text-dark-text mt-0.5">Withdrawals</h1>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, name..."
              className="w-full h-12 pl-11 pr-4 text-sm bg-gray-50 border-2 border-gray-100 rounded-2xl text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all" />
          </div>
          <button type="submit" className="h-12 px-5 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover transition-all shadow-md shadow-blue-500/20">Search</button>
        </form>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: '', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'processing', label: 'Processing' },
            { key: 'completed', label: 'Completed' },
            { key: 'failed', label: 'Failed' },
          ].map((s) => (
            <button key={s.key} onClick={() => { setStatus(s.key); setPage(1) }}
              className={`px-3.5 h-10 rounded-xl text-xs font-semibold transition-all ${
                status === s.key ? 'bg-accent text-white shadow-md shadow-blue-500/20' : 'bg-white border border-gray-200/60 text-gray-500 hover:text-dark-text hover:border-gray-300'
              }`}>{s.label}</button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w, i) => (
                <motion.tr key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono-nums text-xs text-gray-500">{w.reference}</td>
                  <td className="px-5 py-3.5 font-medium text-dark-text">{w.user.displayName}</td>
                  <td className="px-5 py-3.5 font-mono-nums font-bold text-dark-text">{formatNaira(w.amount)}</td>
                  <td className="px-5 py-3.5 text-gray-500">{w.bankName}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono-nums text-xs text-gray-500">{w.accountNumber}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[140px]">{w.accountName}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusColors[w.status] || 'bg-gray-100 text-gray-500'}`}>{w.status}</span>
                    {w.failureReason && (
                      <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={w.failureReason}>{w.failureReason}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{timeAgo(w.createdAt)}</td>
                </motion.tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">{loading ? 'Loading...' : 'No withdrawals found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {p && p.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{p.total} withdrawals · Page {p.page} of {p.totalPages}</p>
          <div className="flex gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2.5 rounded-xl bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"><ChevronLeft className="h-4 w-4 text-gray-500" /></button>
            <button disabled={page >= p.totalPages} onClick={() => setPage(page + 1)} className="p-2.5 rounded-xl bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"><ChevronRight className="h-4 w-4 text-gray-500" /></button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
