import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Users, ShieldAlert, RefreshCw } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira } from '~/lib/utils'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface FraudData {
  highWithdrawal: Array<{ user: { id: string; username: string; displayName: string } | null; totalWithdrawn: number; withdrawalCount: number }>
  frequentFailures: Array<{ user: { id: string; username: string; displayName: string } | null; failureCount: number }>
  duplicateTips: Array<{ senderId: string; recipientId: string; count: number; totalAmount: number }>
}

function FraudSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 bg-gray-100 rounded-md animate-pulse w-32" />
              <div className="h-2 bg-gray-50 rounded-md animate-pulse w-20" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className={`px-5 py-3.5 ${j < 2 ? 'border-b border-gray-50' : ''}`}>
              <div className="h-3 bg-gray-100 rounded-md animate-pulse w-40 mb-1.5" />
              <div className="h-2.5 bg-gray-50 rounded-md animate-pulse w-28" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function FraudPage() {
  const [data, setData] = useState<FraudData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try { setData(await api<FraudData>('/admin/fraud')) } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  if (loading && !data) return <FraudSkeleton />
  if (!data) return (
    <div className="text-center py-20">
      <ShieldAlert className="h-10 w-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-400">Failed to load fraud data</p>
      <button onClick={fetchData} className="mt-3 text-xs font-semibold text-accent hover:text-accent-hover transition-colors">Retry</button>
    </div>
  )

  const totalFlags = data.highWithdrawal.length + data.frequentFailures.length + data.duplicateTips.length

  const sections = [
    {
      title: 'High Withdrawal Volume', icon: TrendingUp, iconColor: 'text-amber-500', iconBg: 'bg-amber-50',
      items: data.highWithdrawal, empty: 'No high withdrawal activity',
      render: (item: any) => (
        <>
          <p className="font-semibold text-dark-text">{item.user?.displayName || 'Unknown'} <span className="text-gray-400 font-normal text-xs">@{item.user?.username}</span></p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono-nums">{item.withdrawalCount} withdrawals · {formatNaira(item.totalWithdrawn)} total</p>
        </>
      ),
    },
    {
      title: 'Frequent Failed Transactions', icon: AlertTriangle, iconColor: 'text-red-500', iconBg: 'bg-red-50',
      items: data.frequentFailures, empty: 'No frequent failures detected',
      render: (item: any) => (
        <>
          <p className="font-semibold text-dark-text">{item.user?.displayName || 'Unknown'} <span className="text-gray-400 font-normal text-xs">@{item.user?.username}</span></p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono-nums">{item.failureCount} failed</p>
        </>
      ),
    },
    {
      title: 'Duplicate Tip Patterns', icon: Users, iconColor: 'text-purple-500', iconBg: 'bg-purple-50',
      items: data.duplicateTips, empty: 'No suspicious patterns',
      render: (t: any) => (
        <>
          <p className="font-semibold text-dark-text"><span className="text-accent">{t.senderId?.slice(0, 8)}</span> → <span className="text-emerald-500">{t.recipientId?.slice(0, 8)}</span></p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono-nums">{t.count} tips · {formatNaira(t.totalAmount)} total</p>
        </>
      ),
    },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-accent text-xs font-semibold uppercase tracking-wider">Detect</p>
          <h1 className="text-2xl font-black text-dark-text mt-0.5">Fraud Indicators</h1>
          <p className="text-sm text-gray-400 mt-0.5">Suspicious activity patterns across the platform</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200/60 rounded-xl text-xs font-semibold text-gray-500 hover:text-dark-text hover:border-gray-300 transition-all disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        {[
          { label: 'Total Flags', value: totalFlags.toString(), icon: ShieldAlert, color: 'bg-red-50 text-red-600 border-red-100' },
          { label: 'High Withdrawal', value: data.highWithdrawal.length.toString(), icon: TrendingUp, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Failed Txns', value: data.frequentFailures.length.toString(), icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-100' },
          { label: 'Repeat Patterns', value: data.duplicateTips.length.toString(), icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-100' },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${s.color} text-xs font-semibold`}>
            <s.icon className="h-3.5 w-3.5" />
            <span className="font-mono-nums">{s.value}</span>
            <span className="opacity-60 font-medium">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {sections.map((s) => (
        <motion.div key={s.title} variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center`}>
              <s.icon className={`h-4 w-4 ${s.iconColor}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-dark-text">{s.title}</h2>
              <p className="text-[10px] text-gray-400">{s.items.length} flagged {s.items.length === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
          {s.items.length > 0 ? (
            <div>
              {s.items.slice(0, 10).map((item: any, i: number) => (
                <div key={i} className={`px-5 py-3.5 hover:bg-gray-50/50 transition-colors ${i < Math.min(s.items.length, 10) - 1 ? 'border-b border-gray-50' : ''}`}>
                  {s.render(item)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <s.icon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{s.empty}</p>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
