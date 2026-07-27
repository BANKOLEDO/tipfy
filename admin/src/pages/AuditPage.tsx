import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity, UserPlus, LogIn, LogOut, Edit, Shield, FileText } from 'lucide-react'
import { api } from '~/lib/api'
import { timeAgo } from '~/lib/utils'
import Pagination from '~/components/Pagination'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface AuditLog {
  id: string; action: string; entity: string; entityId: string | null
  details: Record<string, any> | null; ip: string | null
  createdAt: string; user: { id: string; username: string; displayName: string } | null
}

interface Paged { logs: AuditLog[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

const actionConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  user_created: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'User Created' },
  user_login: { icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Login' },
  user_logout: { icon: LogOut, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Logout' },
  tip_completed: { icon: Activity, color: 'text-accent', bg: 'bg-accent/5', label: 'Tip Completed' },
  withdrawal_requested: { icon: Edit, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Withdrawal' },
  user_role_changed: { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Role Changed' },
}

function getActionConfig(action: string) {
  if (actionConfig[action]) return actionConfig[action]
  if (action.includes('delete')) return { ...actionConfig.user_login, label: action.replace(/_/g, ' ') }
  return { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-50', label: action.replace(/_/g, ' ') }
}

function LogSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < 7 ? 'border-b border-gray-100' : ''}`}>
          <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded-md animate-pulse w-48" />
            <div className="h-2.5 bg-gray-50 rounded-md animate-pulse w-32" />
          </div>
          <div className="h-3 bg-gray-100 rounded-md animate-pulse w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export default function AuditPage() {
  const [data, setData] = useState<Paged | null>(null)
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '30' })
      if (action) params.set('action', action)
      setData(await api<Paged>(`/admin/audit?${params}`))
    } catch { /* ignore */ }
    setLoading(false)
  }, [action])

  useEffect(() => { fetchLogs(page) }, [page, fetchLogs])

  const logs = data?.logs || []
  const p = data?.pagination
  const actions = ['', 'user_created', 'user_login', 'user_logout', 'tip_completed', 'withdrawal_requested', 'user_role_changed']
  const actionLabels: Record<string, string> = {
    '': 'All', user_created: 'Created', user_login: 'Login', user_logout: 'Logout',
    tip_completed: 'Tip Completed', withdrawal_requested: 'Withdrawal', user_role_changed: 'Role Changed',
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-accent text-xs font-semibold uppercase tracking-wider">History</p>
        <h1 className="text-2xl font-black text-dark-text mt-0.5">Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track all platform activity and user actions</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-1.5 flex-wrap">
        {actions.map((a) => (
          <button key={a} onClick={() => { setAction(a); setPage(1) }}
            className={`px-3.5 h-10 rounded-xl text-xs font-semibold transition-all ${
              action === a ? 'bg-accent text-white shadow-md shadow-blue-500/20' : 'bg-white border border-gray-200/60 text-gray-500 hover:text-dark-text hover:border-gray-300'
            }`}>{actionLabels[a]}</button>
        ))}
      </motion.div>

      {loading && !data ? (
        <LogSkeleton />
      ) : (
        <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {logs.map((log, i) => {
            const cfg = getActionConfig(log.action)
            const Icon = cfg.icon
            return (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors ${i < logs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-text">
                    <span className="font-semibold">{log.user?.displayName || 'System'}</span>{' '}
                    <span className="text-gray-500">{cfg.label}</span>
                    {log.entity && <span className="text-gray-400"> on {log.entity}</span>}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate font-mono-nums">{JSON.stringify(log.details)}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{timeAgo(log.createdAt)}</p>
                  {log.ip && <p className="text-[10px] text-gray-300 font-mono-nums mt-0.5">{log.ip}</p>}
                </div>
              </motion.div>
            )
          })}
          {logs.length === 0 && (
            <div className="text-center py-16">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">No logs found</p>
              <p className="text-xs text-gray-300 mt-1">No audit logs match your filter</p>
            </div>
          )}
        </motion.div>
      )}

      {p && <Pagination page={p.page} totalPages={p.totalPages} total={p.total} label="logs" onPageChange={setPage} />}
    </motion.div>
  )
}
