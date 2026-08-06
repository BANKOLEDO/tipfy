import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Wallet, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira, timeAgo } from '~/lib/utils'
import Pagination from '~/components/Pagination'
import TableSkeleton from '~/components/TableSkeleton'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface Withdrawal {
  id: string; amount: number; status: string; bankName: string; accountNumber: string
  accountName: string; reference: string; failureReason: string | null
  fee: number; netAmount: number; estimatedTax: number
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

const statusIcons: Record<string, string> = {
  completed: '✓', pending: '⏳', processing: '●', failed: '✕',
}

export default function WithdrawalsPage() {
  const [data, setData] = useState<Paged | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      setData(await api<Paged>(`/admin/withdrawals?${params}`))
    } catch { /* ignore */ }
    setLoading(false)
  }, [search, status])

  useEffect(() => { fetchAll(page) }, [page, fetchAll])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchAll(1) }
  const withdrawals = data?.withdrawals || []
  const p = data?.pagination

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-accent text-xs font-semibold uppercase tracking-wider">Monitor</p>
        <h1 className="text-2xl font-black text-dark-text mt-0.5">Withdrawals</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review and track withdrawal requests</p>
      </motion.div>

      {p && (
        <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
          {[
            { label: 'Total', value: p.total.toLocaleString(), icon: Wallet, color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { label: 'Pending', value: withdrawals.filter(w => w.status === 'pending').length.toString(), icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100' },
            { label: 'Completed', value: withdrawals.filter(w => w.status === 'completed').length.toString(), icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { label: 'Failed', value: withdrawals.filter(w => w.status === 'failed').length.toString(), icon: AlertCircle, color: 'bg-red-50 text-red-600 border-red-100' },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${s.color} text-xs font-semibold`}>
              <s.icon className="h-3.5 w-3.5" />
              <span className="font-mono-nums">{s.value}</span>
              <span className="opacity-60 font-medium">{s.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, name..."
              className="neo-input w-full h-12 pl-11 pr-4 text-sm" />
          </div>
          <button type="submit" className="h-12 px-6 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover active:scale-[0.97] transition-all shadow-md shadow-blue-500/20">Search</button>
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

      {loading && !data ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Reference', 'User', 'Amount', 'Fee', 'Net', 'Bank', 'Account', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w, i) => (
                  <motion.tr key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5 font-mono-nums text-xs text-gray-500">{w.reference}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-dark-text group-hover:text-accent transition-colors">{w.user.displayName}</p>
                      <p className="text-[10px] text-gray-400">{w.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono-nums font-bold text-dark-text">
                      {formatNaira(w.amount)}
                      {w.netAmount > 0 && <span className="block text-[10px] font-semibold text-emerald-500">payout {formatNaira(w.netAmount)}</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono-nums text-xs text-amber-600">{w.fee > 0 ? formatNaira(w.fee) : <span className="text-emerald-500 font-semibold">free</span>}</td>
                    <td className="px-5 py-3.5 font-mono-nums text-xs text-gray-500">{formatNaira(w.netAmount || w.amount)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs font-medium">{w.bankName}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-mono-nums text-xs text-gray-500">{w.accountNumber}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{w.accountName}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusColors[w.status] || 'bg-gray-100 text-gray-500'}`}>
                        {statusIcons[w.status]} {w.status}
                      </span>
                      {w.failureReason && (
                        <p className="text-[10px] text-red-400 mt-1 max-w-[160px] truncate" title={w.failureReason}>{w.failureReason}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{timeAgo(w.createdAt)}</td>
                  </motion.tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-16">
                    <Wallet className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No withdrawals found</p>
                    <p className="text-xs text-gray-300 mt-1">No withdrawal requests match your filters</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {p && <Pagination page={p.page} totalPages={p.totalPages} total={p.total} label="withdrawals" onPageChange={setPage} />}
    </motion.div>
  )
}
