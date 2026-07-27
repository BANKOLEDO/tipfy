import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira, timeAgo, getInitials } from '~/lib/utils'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface Tip {
  id: string; reference: string; amount: number; status: string; category: string
  senderName: string; message: string; paymentMethod: string; isAnonymous: boolean
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

function TipDetailModal({ tip, onClose }: { tip: Tip; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-md bg-white rounded-3xl border border-gray-200/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all">
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm text-white/70 font-medium">Tip Details</p>
          <p className="text-3xl font-black mt-1 font-mono-nums">{formatNaira(tip.amount)}</p>
          <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide bg-white/20`}>{tip.status}</span>
        </div>
        <div className="p-6 space-y-3">
          {[
            { label: 'Reference', value: tip.reference },
            { label: 'Category', value: tip.category },
            { label: 'Recipient', value: tip.recipient.displayName },
            { label: 'Sender', value: tip.isAnonymous ? 'Anonymous' : (tip.sender?.displayName || tip.senderName || 'N/A') },
            { label: 'Message', value: tip.message || '—' },
            { label: 'Payment', value: tip.paymentMethod || '—' },
            { label: 'Date', value: new Date(tip.createdAt).toLocaleString() },
            ...(tip.completedAt ? [{ label: 'Completed', value: new Date(tip.completedAt).toLocaleString() }] : []),
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
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

  const fetchTips = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res = await api<Paged>(`/admin/tips?${params}`)
      setData(res)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchTips(page) }, [page, status])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchTips(1) }
  const tips = data?.tips || []
  const p = data?.pagination

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Monitor</p>
        <h1 className="text-xl font-bold text-dark-text mt-0.5">Tips</h1>
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

      <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipient</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sender</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {tips.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedTip(t)} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 font-mono-nums text-xs text-gray-500">{t.reference}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent to-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {getInitials(t.recipient.displayName)}
                      </div>
                      <span className="font-medium text-dark-text">{t.recipient.displayName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{t.isAnonymous ? 'Anonymous' : (t.sender?.displayName || t.senderName || 'N/A')}</td>
                  <td className="px-5 py-3.5 font-mono-nums font-bold text-dark-text">{formatNaira(t.amount)}</td>
                  <td className="px-5 py-3.5 text-gray-400 capitalize text-xs">{t.category}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{timeAgo(t.createdAt)}</td>
                </motion.tr>
              ))}
              {tips.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">{loading ? 'Loading...' : 'No tips found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {p && p.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{p.total} tips · Page {p.page} of {p.totalPages}</p>
          <div className="flex gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2.5 rounded-xl bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"><ChevronLeft className="h-4 w-4 text-gray-500" /></button>
            <button disabled={page >= p.totalPages} onClick={() => setPage(page + 1)} className="p-2.5 rounded-xl bg-white border border-gray-200/60 hover:bg-gray-50 disabled:opacity-30 transition-all"><ChevronRight className="h-4 w-4 text-gray-500" /></button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedTip && <TipDetailModal tip={selectedTip} onClose={() => setSelectedTip(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}
