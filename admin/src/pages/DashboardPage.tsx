import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, ArrowDownLeft, Wallet, TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira } from '~/lib/utils'

interface Stats {
  users: { total: number; newToday: number; new7d: number; active7d: number }
  tips: { total: number; today: number; new7d: number; totalVolume: number; volumeToday: number }
  withdrawals: { total: number; pending: number; processing: number; failed: number }
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api<Stats>('/admin/stats').then(setStats).catch(() => {})
  }, [])

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Admin</p>
          <h1 className="text-xl font-bold text-dark-text mt-0.5">Platform Overview</h1>
        </div>
      </motion.div>

      {/* Stat Cards — gradient style matching frontend dashboard */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: stats?.users.total.toLocaleString() || '—', sub: `${stats?.users.newToday || 0} today`, icon: Users, bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { label: 'Total Tips', value: stats?.tips.total.toLocaleString() || '—', sub: `${stats?.tips.today || 0} today`, icon: ArrowDownLeft, bg: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25' },
          { label: 'Volume', value: stats ? formatNaira(stats.tips.totalVolume) : '—', sub: stats ? `${formatNaira(stats.tips.volumeToday)} today` : '', icon: TrendingUp, bg: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/25' },
          { label: 'Withdrawals', value: stats?.withdrawals.total.toLocaleString() || '—', sub: `${stats?.withdrawals.pending || 0} pending`, icon: Wallet, bg: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/25' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.bg} p-4 text-white shadow-lg ${s.shadow} cursor-default`}>
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10" />
            <div className="absolute -bottom-2 -left-2 h-10 w-10 rounded-full bg-white/10" />
            <div className="relative">
              <s.icon className="h-5 w-5 text-white/80" />
              <p className="text-2xl font-black mt-2 font-mono-nums">{s.value}</p>
              <p className="text-xs text-white/70 font-medium mt-0.5">{s.label}</p>
              {s.sub && <p className="text-[10px] text-white/50 mt-0.5">{s.sub}</p>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pending Withdrawals Alert */}
      {stats && stats.withdrawals.pending > 0 && (
        <motion.div variants={fadeUp}
          className="rounded-2xl bg-white border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-dark-text">Pending Withdrawals</p>
            <p className="text-xs text-gray-400">{stats.withdrawals.pending} awaiting review</p>
          </div>
          <Link to="/admin/withdrawals" className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors">Review →</Link>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
        {[
          { label: 'Manage Users', desc: 'View, edit, disable', href: '/admin/users', icon: Users, color: 'bg-blue-50 text-blue-500 group-hover:bg-blue-100', ring: 'bg-blue-50' },
          { label: 'Monitor Tips', desc: 'Track all transactions', href: '/admin/tips', icon: ArrowDownLeft, color: 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100', ring: 'bg-emerald-50' },
          { label: 'Review Withdrawals', desc: 'Approve or flag', href: '/admin/withdrawals', icon: Wallet, color: 'bg-amber-50 text-amber-500 group-hover:bg-amber-100', ring: 'bg-amber-50' },
          { label: 'Fraud Detection', desc: 'Suspicious patterns', href: '/admin/fraud', icon: Shield, color: 'bg-red-50 text-red-500 group-hover:bg-red-100', ring: 'bg-red-50' },
        ].map((a) => (
          <Link key={a.href} to={a.href} className="group">
            <motion.div whileHover={{ y: -3, rotateX: 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
              <div className={`absolute -bottom-6 -right-6 h-20 w-20 rounded-full ${a.ring} group-hover:scale-110 transition-transform`} />
              <div className="relative flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${a.color} transition-colors`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-dark-text">{a.label}</p>
                  <p className="text-xs text-gray-400">{a.desc}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  )
}
