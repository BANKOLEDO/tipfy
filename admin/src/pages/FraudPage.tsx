import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Users } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira } from '~/lib/utils'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface FraudData {
  highWithdrawal: Array<{ userId: string; username: string; displayName: string; totalWithdrawn: number; withdrawalCount: number }>
  frequentFailed: Array<{ userId: string; username: string; displayName: string; failedCount: number; totalAmount: number }>
  repeatTips: Array<{ recipientId: string; recipientName: string; senderId: string; senderName: string; count: number; totalAmount: number }>
}

export default function FraudPage() {
  const [data, setData] = useState<FraudData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try { setData(await api<FraudData>('/admin/fraud')) } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>
  if (!data) return <div className="text-center py-20 text-gray-400 text-sm">Failed to load fraud data</div>

  const sections = [
    {
      title: 'High Withdrawal Volume', icon: TrendingUp, iconColor: 'text-amber-500', iconBg: 'bg-amber-50',
      items: data.highWithdrawal, empty: 'No high withdrawal activity',
      render: (u: any) => (
        <>
          <p className="font-semibold text-dark-text">{u.displayName} <span className="text-gray-400 font-normal text-xs">@{u.username}</span></p>
          <p className="text-xs text-gray-400 mt-0.5">{u.withdrawalCount} withdrawals · {formatNaira(u.totalWithdrawn)} total</p>
        </>
      ),
    },
    {
      title: 'Frequent Failed Transactions', icon: AlertTriangle, iconColor: 'text-red-500', iconBg: 'bg-red-50',
      items: data.frequentFailed, empty: 'No frequent failures detected',
      render: (u: any) => (
        <>
          <p className="font-semibold text-dark-text">{u.displayName} <span className="text-gray-400 font-normal text-xs">@{u.username}</span></p>
          <p className="text-xs text-gray-400 mt-0.5">{u.failedCount} failed · {formatNaira(u.totalAmount)} total</p>
        </>
      ),
    },
    {
      title: 'Repeat Tip Patterns', icon: Users, iconColor: 'text-purple-500', iconBg: 'bg-purple-50',
      items: data.repeatTips, empty: 'No suspicious patterns',
      render: (t: any) => (
        <>
          <p className="font-semibold text-dark-text"><span className="text-accent">{t.senderName}</span> → <span className="text-emerald-500">{t.recipientName}</span></p>
          <p className="text-xs text-gray-400 mt-0.5">{t.count} tips · {formatNaira(t.totalAmount)} total</p>
        </>
      ),
    },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Detect</p>
        <h1 className="text-xl font-bold text-dark-text mt-0.5">Fraud Indicators</h1>
      </motion.div>

      {sections.map((s, si) => (
        <motion.div key={s.title} variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center`}>
              <s.icon className={`h-4 w-4 ${s.iconColor}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-dark-text">{s.title}</h2>
              <p className="text-[10px] text-gray-400">{s.items.length} flagged</p>
            </div>
          </div>
          {s.items.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {s.items.slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  {s.render(item)}
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-400">{s.empty}</p>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
