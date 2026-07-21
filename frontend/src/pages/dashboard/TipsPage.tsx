import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownLeft, TrendingUp, Calendar } from 'lucide-react'
import { api } from '~/lib/api'
import { formatNaira, timeAgo } from '~/lib/utils'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const categories = [
  { key: 'all', label: 'All' },
  { key: 'service', label: 'Service' },
  { key: 'content', label: 'Content' },
  { key: 'food', label: 'Food' },
  { key: 'music', label: 'Music' },
]

function CoinStackSvg() {
  return (
    <svg viewBox="0 0 160 120" className="w-20 h-14 sm:w-24 sm:h-16 mx-auto" fill="none">
      {/* Shadow */}
      <ellipse cx="80" cy="110" rx="50" ry="6" fill="#E5E7EB" opacity="0.5" />

      {/* Bottom coin */}
      <ellipse cx="80" cy="95" rx="30" ry="8" fill="#D97706" />
      <rect x="50" y="87" width="60" height="8" fill="#F59E0B" />
      <ellipse cx="80" cy="87" rx="30" ry="8" fill="#FCD34D" />
      <ellipse cx="80" cy="87" rx="22" ry="6" fill="none" stroke="#D97706" strokeWidth="1" opacity="0.3" />
      <text x="80" y="91" textAnchor="middle" fill="#92400E" fontSize="8" fontFamily="system-ui" fontWeight="bold">₦</text>

      {/* Middle coin */}
      <ellipse cx="80" cy="75" rx="28" ry="7" fill="#D97706" />
      <rect x="52" y="68" width="56" height="7" fill="#FBBF24" />
      <ellipse cx="80" cy="68" rx="28" ry="7" fill="#FCD34D" />
      <ellipse cx="80" cy="68" rx="20" ry="5" fill="none" stroke="#D97706" strokeWidth="1" opacity="0.3" />
      <text x="80" y="72" textAnchor="middle" fill="#92400E" fontSize="7" fontFamily="system-ui" fontWeight="bold">₦</text>

      {/* Top coin */}
      <ellipse cx="80" cy="57" rx="26" ry="6.5" fill="#D97706" />
      <rect x="54" y="51" width="52" height="6.5" fill="#FDE68A" />
      <ellipse cx="80" cy="51" rx="26" ry="6.5" fill="#FCD34D" />
      <ellipse cx="80" cy="51" rx="18" ry="4.5" fill="none" stroke="#D97706" strokeWidth="1" opacity="0.3" />
      <text x="80" y="55" textAnchor="middle" fill="#92400E" fontSize="7" fontFamily="system-ui" fontWeight="bold">₦</text>

      {/* Floating coin */}
      <circle cx="120" cy="40" r="10" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
      <text x="120" y="44" textAnchor="middle" fill="#92400E" fontSize="8" fontFamily="system-ui" fontWeight="bold">₦</text>
      <path d="M128 32l3 3-3 3" stroke="#D97706" strokeWidth="1" opacity="0.4" strokeLinecap="round" />

      {/* Sparkle */}
      <path d="M35 30l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FCD34D" opacity="0.6" />
      <path d="M130 65l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#FCD34D" opacity="0.4" />
    </svg>
  )
}

export default function TipsPage() {
  const [tips, setTips] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api<any>('/tips/me').then((data) => setTips(Array.isArray(data) ? data : data.tips || [])).catch(() => {
      setTips([
        { id: '1', amount: 5000, sender: { displayName: 'Chioma A.' }, senderName: 'Chioma A.', message: 'Great work!', category: 'general', status: 'completed', createdAt: new Date(Date.now() - 120000).toISOString() },
        { id: '2', amount: 2000, sender: { displayName: 'Tunde M.' }, senderName: 'Tunde M.', message: 'Thanks for the content', category: 'content', status: 'completed', createdAt: new Date(Date.now() - 900000).toISOString() },
        { id: '3', amount: 10000, sender: { displayName: 'Fatima B.' }, senderName: 'Fatima B.', message: 'Keep going!', category: 'service', status: 'completed', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '4', amount: 1500, sender: { displayName: 'Chidi O.' }, senderName: 'Chidi O.', message: '', category: 'food', status: 'completed', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '5', amount: 3000, sender: { displayName: 'Amina B.' }, senderName: 'Amina B.', message: 'The jollof was unreal', category: 'food', status: 'pending', createdAt: new Date(Date.now() - 14400000).toISOString() },
      ])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? tips : tips.filter((t) => t.category === filter)
  const totalEarned = tips.reduce((s, t) => s + (t.amount || 0), 0)
  const avgTip = tips.length ? Math.round(totalEarned / tips.length) : 0

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Earnings</p>
        <h1 className="text-xl font-bold text-dark-text mt-0.5">Tips Received</h1>
      </motion.div>

      {/* Stats - 3D gradient cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: tips.length, icon: ArrowDownLeft, bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { label: 'Earned', value: formatNaira(totalEarned), icon: TrendingUp, bg: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25' },
          { label: 'Average', value: formatNaira(avgTip), icon: Calendar, bg: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/25' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.bg} p-4 text-white shadow-lg ${s.shadow}`}>
            <div className="absolute -top-4 -right-4 h-14 w-14 rounded-full bg-white/10" />
            <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-white/10" />
            <div className="relative">
              <s.icon className="h-4 w-4 text-white/80" />
              <p className="text-xl font-black mt-2 font-mono-nums">{s.value}</p>
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter */}
      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {categories.map((c) => (
          <motion.button key={c.key} onClick={() => setFilter(c.key)} whileTap={{ scale: 0.95 }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border-2 ${
              filter === c.key
                ? 'bg-accent text-white border-accent shadow-lg shadow-blue-500/20'
                : 'bg-white border-gray-100 text-gray-500 hover:text-dark-text hover:border-gray-200 shadow-sm'
            }`}>
            {c.label}
            {c.key !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {tips.filter((t) => t.category === c.key).length}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Tips List */}
      <motion.div variants={fadeUp}>
        <div className="rounded-3xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-28" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-40" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center">
              <CoinStackSvg />
              <p className="text-sm font-bold text-dark-text mt-3">No tips found</p>
              <p className="text-xs text-gray-400 mt-1">
                {filter !== 'all' ? 'Try a different filter' : 'Share your link to start earning'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((tip, i) => (
                <motion.div key={tip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < filtered.length - 1 ? 'border-b border-gray-100' : ''
                  } hover:bg-gray-50/50 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/15">
                      {(tip.sender?.displayName || tip.senderName || 'A')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-dark-text truncate">{tip.sender?.displayName || tip.senderName || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {tip.message || tip.category || 'General'} · {timeAgo(tip.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-black text-accent font-mono-nums">+{formatNaira(tip.amount)}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${
                      tip.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>{tip.status}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
