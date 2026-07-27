import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Database, Server, Clock, Activity } from 'lucide-react'
import { api } from '~/lib/api'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface HealthData {
  database: string
  uptime: number
  memory: { heapUsed: number; heapTotal: number; rss: number }
  timestamp: string
}

function formatBytes(bytes: number) { return `${(bytes / (1024 * 1024)).toFixed(1)} MB` }
function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function HealthSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded-md animate-pulse w-16" />
          <div className="h-5 bg-gray-100 rounded-md animate-pulse w-36" />
        </div>
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden">
            <div className="h-28 bg-gray-100 animate-pulse" />
            <div className="px-5 py-3"><div className="h-3 bg-gray-100 rounded-md animate-pulse w-28" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SystemPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    setLoading(true)
    try { setData(await api<HealthData>('/admin/health')) } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchHealth() }, [])

  if (loading && !data) return <HealthSkeleton />
  if (!data) return (
    <div className="text-center py-20">
      <Activity className="h-10 w-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-400">Failed to load health data</p>
      <button onClick={fetchHealth} className="mt-3 text-xs font-semibold text-accent hover:text-accent-hover transition-colors">Retry</button>
    </div>
  )

  const dbConnected = data.database === 'connected'
  const memPercent = data.memory ? Math.round((data.memory.heapUsed / data.memory.heapTotal) * 100) : 0

  const cards = [
    {
      title: 'Database', icon: Database,
      gradient: 'from-emerald-500 to-emerald-600',
      value: dbConnected ? 'Connected' : 'Disconnected',
      sub: 'PostgreSQL connection',
      ok: dbConnected,
    },
    {
      title: 'Server Uptime', icon: Server,
      gradient: 'from-accent to-blue-600',
      value: formatUptime(data.uptime),
      sub: 'Since last restart',
      ok: true,
    },
    {
      title: 'Heap Memory', icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      value: `${memPercent}%`,
      sub: data.memory ? `${formatBytes(data.memory.heapUsed)} of ${formatBytes(data.memory.heapTotal)}` : '—',
      ok: memPercent < 85,
    },
    {
      title: 'RSS Memory', icon: Server,
      gradient: 'from-purple-500 to-purple-600',
      value: data.memory ? formatBytes(data.memory.rss) : '—',
      sub: 'Resident set size',
      ok: true,
    },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-accent text-xs font-semibold uppercase tracking-wider">Ops</p>
          <h1 className="text-2xl font-black text-dark-text mt-0.5">System Health</h1>
          <p className="text-sm text-gray-400 mt-0.5">Server status and resource monitoring</p>
        </div>
        <button onClick={fetchHealth} disabled={loading}
          className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200/60 rounded-xl text-xs font-semibold text-gray-500 hover:text-dark-text hover:border-gray-300 transition-all disabled:opacity-50 active:scale-[0.97]">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c) => (
          <motion.div key={c.title} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className={`bg-gradient-to-br ${c.gradient} p-5 text-white relative overflow-hidden`}>
              <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between">
                <c.icon className="h-5 w-5 text-white/80" />
                <div className={`h-2.5 w-2.5 rounded-full ${c.ok ? 'bg-emerald-300' : 'bg-red-300'} shadow-lg`} />
              </div>
              <p className="text-2xl font-black mt-3 font-mono-nums">{c.value}</p>
              <p className="text-xs text-white/60 mt-0.5">{c.title}</p>
            </div>
            <div className="px-5 py-3">
              <p className="text-xs text-gray-400">{c.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-dark-text uppercase tracking-wider">Raw Health Data</p>
          <p className="text-[10px] text-gray-300 font-mono-nums">{new Date(data.timestamp).toLocaleString()}</p>
        </div>
        <pre className="text-[11px] text-gray-500 font-mono-nums bg-gray-50 rounded-xl p-4 overflow-x-auto max-h-48">
          {JSON.stringify(data, null, 2)}
        </pre>
      </motion.div>
    </motion.div>
  )
}
