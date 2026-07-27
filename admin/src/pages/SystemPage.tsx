import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Database, Server, Clock } from 'lucide-react'
import { api } from '~/lib/api'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface HealthData {
  database: { connected: boolean; latency: number | null }
  server: { uptime: number; memory: { heapUsed: number; heapTotal: number; rss: number } }
  status: string; timestamp: string
}

function formatBytes(mb: number) { return `${(mb / (1024 * 1024)).toFixed(1)} MB` }
function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
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

  if (loading && !data) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>
  if (!data) return <div className="text-center py-20 text-gray-400 text-sm">Failed to load health data</div>

  const cards = [
    {
      title: 'Database', icon: Database,
      gradient: 'from-emerald-500 to-emerald-600',
      value: data.database.connected ? 'Connected' : 'Disconnected',
      sub: data.database.latency !== null ? `${data.database.latency}ms latency` : '—',
      ok: data.database.connected,
    },
    {
      title: 'Server Uptime', icon: Server,
      gradient: 'from-accent to-blue-600',
      value: formatUptime(data.server.uptime),
      sub: 'Since last restart',
      ok: true,
    },
    {
      title: 'Heap Memory', icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      value: formatBytes(data.server.memory.heapUsed),
      sub: `of ${formatBytes(data.server.memory.heapTotal)} allocated`,
      ok: data.server.memory.heapUsed / data.server.memory.heapTotal < 0.85,
    },
    {
      title: 'RSS Memory', icon: Server,
      gradient: 'from-purple-500 to-purple-600',
      value: formatBytes(data.server.memory.rss),
      sub: 'Resident set size',
      ok: true,
    },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Ops</p>
          <h1 className="text-xl font-bold text-dark-text mt-0.5">System Health</h1>
        </div>
        <button onClick={fetchHealth} disabled={loading}
          className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-200/60 rounded-xl text-xs font-semibold text-gray-500 hover:text-dark-text hover:border-gray-300 transition-all disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <motion.div key={c.title} variants={fadeUp}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className={`bg-gradient-to-br ${c.gradient} p-5 text-white`}>
              <div className="flex items-center justify-between">
                <c.icon className="h-5 w-5 text-white/80" />
                <div className={`h-2 w-2 rounded-full ${c.ok ? 'bg-emerald-300' : 'bg-red-300'} shadow-lg`} />
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
        <p className="text-xs font-semibold text-dark-text mb-3">Raw Health Data</p>
        <pre className="text-[11px] text-gray-500 font-mono-nums bg-gray-50 rounded-xl p-4 overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </motion.div>
    </motion.div>
  )
}
