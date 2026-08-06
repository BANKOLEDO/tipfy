import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowDownLeft, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira, timeAgo, getInitials } from '~/lib/utils'
import Pagination from '~/components/Pagination'
import TableSkeleton from '~/components/TableSkeleton'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface Tip {
  id: string; reference: string; amount: number; status: string; category: string
  senderName: string; message: string; paymentMethod: string; isAnonymous: boolean
  platformFee: number; netAmount: number; totalCharged: number
  completedAt: string | null; createdAt: string
  recipient: { id: string; username: string; displayName: string }
  sender: { id: string; username: string; displayName: string } | null
}

interface Paged { tips: Tip[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  processing: 'bg-blue-50 text-blue-600 border border-blue-100',
  failed: 'bg-red-50 text-red-600 border border-red-100',
}

const statusIcons: Record<string, string> = {
  completed: '✓', pending: '⏳', processing: '●', failed: '✕',
}

function TipDetailModal({ tip, onClose }: { tip: Tip; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-md bg-white rounded-3xl border border-gray-200/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 text-white relative ${
          tip.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
          tip.status === 'failed' ? 'bg-gradient-to-br from-red-500 to-red-600' :
          tip.status === 'pending' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
          'bg-gradient-to-br from-accent to-blue-600'
        }`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all">
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm text-white/70 font-medium">Tip Details</p>
          <p className="text-3xl font-black mt-1 font-mono-nums">{formatNaira(tip.amount)}</p>
          <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide bg-white/20">{statusIcons[tip.status]} {tip.status}</span>
        </div>
        <div className="p-6 space-y-3">
          {[
            { label: 'Reference', value: tip.reference },
            { label: 'Category', value: tip.category },
            { label: 'Recipient', value: tip.recipient.displayName },
            { label: 'Sender', value: tip.isAnonymous ? 'Anonymous' : (tip.sender?.displayName || tip.senderName || 'N/A') },
            { label: 'Message', value: tip.message || '—' },
            { label: 'Payment', value: tip.paymentMethod || '—' },
            { label: 'Platform fee', value: `−${formatNaira(tip.platformFee || 0)}` },
            { label: 'Recipient gets', value: formatNaira(tip.netAmount || tip.amount) },
            { label: 'Total charged', value: formatNaira(tip.totalCharged || tip.amount) },
            { label: 'Date', value: new Date(tip.createdAt).toLocaleString() },
            ...(tip.completedAt ? [{ label: 'Completed', value: new Date(tip.completedAt).toLocaleString() }] : []),
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-400">{row.label}</span>
              <span className="font-medium text-dark-text text-right max-w-[220px] truncate">{row.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function TipsPage() {
  const [data, setData] = useState<Paged | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null)

  const fetchTips = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      setData(await api<Paged>(`/admin/tips?${params}`))
    } catch { /* ignore */ }
    setLoading(false)
  }, [search, status])

  useEffect(() => { fetchTips(page) }, [page, fetchTips])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchTips(1) }
  const tips = data?.tips || []
  const p = data?.pagination

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-accent text-xs font-semibold uppercase tracking-wider">Monitor</p>
        <h1 className="text-2xl font-black text-dark-text mt-0.5">Tips</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track all tip transactions across the platform</p>
      </motion.div>

      {p && (
        <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
          {[
            { label: 'Total Tips', value: p.total.toLocaleString(), icon: ArrowDownLeft, color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { label: 'On This Page', value: tips.length.toString(), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { label: 'Failed', value: tips.filter(t => t.status === 'failed').length.toString(), icon: AlertCircle, color: 'bg-red-50 text-red-600 border-red-100' },
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
            { key: 'completed', label: 'Completed' },
            { key: 'pending', label: 'Pending' },
            { key: 'processing', label: 'Processing' },
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
                  {['Reference', 'Recipient', 'Sender', 'Amount', 'Fee', 'Category', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tips.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedTip(t)}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                    <td className="px-5 py-3.5 font-mono-nums text-xs text-gray-500">{t.reference}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent to-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {getInitials(t.recipient.displayName)}
                        </div>
                        <span className="font-medium text-dark-text group-hover:text-accent transition-colors">{t.recipient.displayName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{t.isAnonymous ? 'Anonymous' : (t.sender?.displayName || t.senderName || 'N/A')}</td>
                    <td className="px-5 py-3.5 font-mono-nums font-bold text-dark-text">
                      {formatNaira(t.amount)}
                      {t.netAmount > 0 && <span className="block text-[10px] font-semibold text-emerald-500">net {formatNaira(t.netAmount)}</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono-nums text-xs text-amber-600">−{formatNaira(t.platformFee || 0)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-gray-100 text-gray-500">{t.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}`}>
                        {statusIcons[t.status]} {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{timeAgo(t.createdAt)}</td>
                  </motion.tr>
                ))}
                {tips.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16">
                    <ArrowDownLeft className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No tips found</p>
                    <p className="text-xs text-gray-300 mt-1">No tips match your current filters</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {p && <Pagination page={p.page} totalPages={p.totalPages} total={p.total} label="tips" onPageChange={setPage} />}

      <AnimatePresence>
        {selectedTip && <TipDetailModal tip={selectedTip} onClose={() => setSelectedTip(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}
