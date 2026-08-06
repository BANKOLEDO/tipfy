import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '~/lib/api'
import { useAuthStore, useUIStore } from '~/lib/store'
import { Avatar } from '~/components/ui/Avatar'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function TeamSvg() {
  return (
    <svg viewBox="0 0 200 140" className="w-36 h-24 mx-auto" fill="none">
      {/* Shadow */}
      <ellipse cx="100" cy="130" rx="60" ry="8" fill="#E5E7EB" opacity="0.5" />

      {/* Person 1 - Left */}
      <g transform="translate(30, 30)">
        <circle cx="40" cy="20" r="16" fill="url(#person1Grad)" />
        <circle cx="40" cy="20" r="14" fill="#BFDBFE" />
        <circle cx="40" cy="16" r="8" fill="#93C5FD" />
        <path d="M26 38 Q40 48 54 38" fill="#93C5FD" />
        <circle cx="36" cy="18" r="1.5" fill="#1E40AF" />
        <circle cx="44" cy="18" r="1.5" fill="#1E40AF" />
        <path d="M37 23 Q40 26 43 23" stroke="#1E40AF" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      {/* Person 2 - Right */}
      <g transform="translate(100, 30)">
        <circle cx="40" cy="20" r="16" fill="url(#person2Grad)" />
        <circle cx="40" cy="20" r="14" fill="#BBF7D0" />
        <circle cx="40" cy="16" r="8" fill="#86EFAC" />
        <path d="M26 38 Q40 48 54 38" fill="#86EFAC" />
        <circle cx="36" cy="18" r="1.5" fill="#166534" />
        <circle cx="44" cy="18" r="1.5" fill="#166534" />
        <path d="M37 23 Q40 26 43 23" stroke="#166534" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      {/* Connection line */}
      <line x1="70" y1="70" x2="130" y2="70" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Coin between them */}
      <circle cx="100" cy="60" r="12" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
      <text x="100" y="64" textAnchor="middle" fill="#92400E" fontSize="10" fontFamily="system-ui" fontWeight="bold">₦</text>

      {/* Split arrows */}
      <path d="M88 60 L78 50" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M112 60 L122 50" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

      <defs>
        <linearGradient id="person1Grad" x1="24" y1="4" x2="56" y2="56">
          <stop offset="0%" stopColor="#BFDBFE" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
        <linearGradient id="person2Grad" x1="124" y1="4" x2="156" y2="56">
          <stop offset="0%" stopColor="#BBF7D0" />
          <stop offset="100%" stopColor="#86EFAC" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function TeamPage() {
  const { user } = useAuthStore()
  const [teams, setTeams] = useState<any[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    api<any>('/teams').then((data) => setTeams(Array.isArray(data) ? data : data.team || [])).catch(() => {})
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/teams', { method: 'POST', body: { username } })
      addToast('success', 'Member added!')
      setUsername('')
    api<any>('/teams').then((data) => setTeams(Array.isArray(data) ? data : data.team || [])).catch(() => {})
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  const handleRemove = async (memberId: string) => {
    try {
      await api(`/teams/${memberId}`, { method: 'DELETE' })
      setTeams((prev) => prev.filter((t) => t.id !== memberId))
      addToast('success', 'Member removed')
    } catch (err) {
      addToast('error', 'Failed to remove member')
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Manage</p>
        <h1 className="text-xl font-bold text-dark-text mt-0.5">Team</h1>
      </motion.div>

      {/* Add Member Card */}
      <motion.div variants={fadeUp} className="rounded-3xl bg-white border border-gray-200/60 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
            <input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 pl-9 pr-4 text-sm bg-gray-50 border-2 border-gray-100 rounded-2xl text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all" />
          </div>
          <motion.button type="submit" disabled={loading || !username.trim()} whileTap={{ scale: 0.95 }}
            className="h-12 px-5 bg-gradient-to-r from-accent to-blue-600 text-white rounded-2xl text-sm font-bold hover:from-accent-hover hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> Add
          </motion.button>
        </form>
      </motion.div>

      {/* Members */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-dark-text">Members</h2>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{teams.length}</span>
        </div>
        <div className="rounded-3xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {teams.length === 0 ? (
            <div className="py-8 flex flex-col items-center">
              <TeamSvg />
              <p className="text-sm font-bold text-dark-text mt-2">No team members</p>
              <p className="text-xs text-gray-400 mt-1">Add someone to start splitting tips</p>
            </div>
          ) : (
            <AnimatePresence>
              {teams.map((member, i) => (
                <motion.div key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < teams.length - 1 ? 'border-b border-gray-100' : ''
                  } hover:bg-gray-50/50 transition-colors group`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.displayName || member.username} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-dark-text">{member.displayName}</p>
                      <p className="text-xs text-gray-400">@{member.username}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(member.id)}
                    className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Split Info Banner */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 p-5">
        <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-blue-200/30" />
        <div className="absolute -bottom-2 -left-2 h-10 w-10 rounded-full bg-blue-200/30" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-dark-text">Tip Splitting</p>
            <p className="text-xs text-gray-500">Tips are split {teams.length > 0 ? `evenly between ${teams.length + 1} members` : 'only you receive tips right now'}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
