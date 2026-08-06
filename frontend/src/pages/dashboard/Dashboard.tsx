import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Share2, Check, ArrowDownLeft, TrendingUp, Star, Wallet, Send, Copy } from 'lucide-react'
import { api } from '~/lib/api'
import { useAuthStore } from '~/lib/store'
import { formatNaira, timeAgo } from '~/lib/utils'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function Wallet3D() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Shadow */}
      <ellipse cx="100" cy="145" rx="60" ry="8" fill="#E5E7EB" opacity="0.5" />

      {/* Back panel */}
      <rect x="40" y="35" width="120" height="90" rx="12" fill="#1E40AF" />
      <rect x="40" y="35" width="120" height="90" rx="12" fill="url(#walletGrad1)" />

      {/* Front panel (3D depth) */}
      <rect x="46" y="41" width="120" height="90" rx="12" fill="#2563EB" />
      <rect x="46" y="41" width="120" height="90" rx="12" fill="url(#walletGrad2)" />

      {/* Card slot */}
      <rect x="62" y="62" width="50" height="32" rx="6" fill="white" opacity="0.2" />
      <rect x="62" y="62" width="50" height="32" rx="6" stroke="white" strokeWidth="1" opacity="0.3" />

      {/* Chip */}
      <rect x="68" y="70" width="12" height="9" rx="2" fill="#FCD34D" opacity="0.8" />
      <line x1="74" y1="70" x2="74" y2="79" stroke="#D97706" strokeWidth="0.5" opacity="0.5" />
      <line x1="68" y1="74.5" x2="80" y2="74.5" stroke="#D97706" strokeWidth="0.5" opacity="0.5" />

      {/* Naira symbol on card */}
      <text x="80" y="83" fill="white" fontSize="8" fontFamily="system-ui" fontWeight="bold" opacity="0.6">₦</text>

      {/* Clasp */}
      <rect x="130" y="68" width="22" height="16" rx="4" fill="#1E40AF" />
      <rect x="130" y="68" width="22" height="16" rx="4" stroke="#3B82F6" strokeWidth="1" />
      <circle cx="141" cy="76" r="3" fill="#3B82F6" />

      {/* Floating coins */}
      <g opacity="0.9">
        <circle cx="155" cy="28" r="10" fill="#FCD34D" />
        <circle cx="155" cy="28" r="10" fill="url(#coinGrad)" />
        <circle cx="155" cy="28" r="7" fill="none" stroke="#D97706" strokeWidth="0.8" opacity="0.4" />
        <text x="155" y="32" textAnchor="middle" fill="#92400E" fontSize="9" fontFamily="system-ui" fontWeight="bold">₦</text>
      </g>
      <g opacity="0.6">
        <circle cx="170" cy="50" r="7" fill="#FCD34D" />
        <circle cx="170" cy="50" r="7" fill="url(#coinGrad)" />
        <text x="170" y="53" textAnchor="middle" fill="#92400E" fontSize="6" fontFamily="system-ui" fontWeight="bold">₦</text>
      </g>
      <g opacity="0.4">
        <circle cx="32" cy="55" r="6" fill="#FCD34D" />
        <text x="32" y="58" textAnchor="middle" fill="#92400E" fontSize="5" fontFamily="system-ui" fontWeight="bold">₦</text>
      </g>

      {/* Sparkles */}
      <path d="M175 20l1.5 3 3 1.5-3 1.5L175 29l-1.5-3-3-1.5 3-1.5z" fill="#FCD34D" opacity="0.7" />
      <path d="M30 40l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#FCD34D" opacity="0.5" />

      <defs>
        <linearGradient id="walletGrad1" x1="40" y1="35" x2="160" y2="125">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="walletGrad2" x1="46" y1="41" x2="166" y2="131">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function TipJar3D() {
  return (
    <svg viewBox="0 0 160 180" className="w-16 h-18 sm:w-20 sm:h-22 mx-auto" fill="none">
      {/* Shadow */}
      <ellipse cx="80" cy="170" rx="45" ry="6" fill="#D1D5DB" opacity="0.4" />

      {/* Jar body */}
      <path d="M40 60 L35 155 Q35 165 45 165 L115 165 Q125 165 125 155 L120 60 Z" fill="url(#jarBody)" stroke="#D1D5DB" strokeWidth="1.5" />
      <path d="M40 60 L35 155 Q35 165 45 165 L115 165 Q125 165 125 155 L120 60 Z" fill="url(#jarGlass)" opacity="0.3" />

      {/* Jar neck */}
      <rect x="45" y="42" width="70" height="20" rx="3" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1.5" />

      {/* Lid */}
      <rect x="40" y="35" width="80" height="10" rx="5" fill="url(#lidGrad)" stroke="#B45309" strokeWidth="1" />

      {/* Coins inside jar */}
      <circle cx="60" cy="140" r="8" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" />
      <text x="60" y="143" textAnchor="middle" fill="#92400E" fontSize="7" fontFamily="system-ui" fontWeight="bold">₦</text>

      <circle cx="80" cy="135" r="8" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
      <text x="80" y="138" textAnchor="middle" fill="#92400E" fontSize="7" fontFamily="system-ui" fontWeight="bold">₦</text>

      <circle cx="100" cy="142" r="8" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" />
      <text x="100" y="145" textAnchor="middle" fill="#92400E" fontSize="7" fontFamily="system-ui" fontWeight="bold">₦</text>

      <circle cx="70" cy="128" r="7" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" opacity="0.8" />
      <circle cx="90" cy="125" r="7" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" opacity="0.9" />

      {/* Falling coin */}
      <g>
        <circle cx="80" cy="18" r="9" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
        <text x="80" y="22" textAnchor="middle" fill="#92400E" fontSize="8" fontFamily="system-ui" fontWeight="bold">₦</text>
        {/* Motion lines */}
        <line x1="74" y1="10" x2="74" y2="4" stroke="#D97706" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        <line x1="80" y1="8" x2="80" y2="1" stroke="#D97706" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
        <line x1="86" y1="10" x2="86" y2="4" stroke="#D97706" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      </g>

      {/* Label on jar */}
      <rect x="55" y="90" width="50" height="20" rx="3" fill="white" opacity="0.7" />
      <text x="80" y="104" textAnchor="middle" fill="#6B7280" fontSize="8" fontFamily="system-ui" fontWeight="600">TIPS</text>

      <defs>
        <linearGradient id="jarBody" x1="35" y1="60" x2="125" y2="165">
          <stop offset="0%" stopColor="#F3F4F6" />
          <stop offset="100%" stopColor="#E5E7EB" />
        </linearGradient>
        <linearGradient id="jarGlass" x1="40" y1="60" x2="120" y2="165">
          <stop offset="0%" stopColor="white" />
          <stop offset="50%" stopColor="transparent" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
        <linearGradient id="lidGrad" x1="40" y1="35" x2="120" y2="45">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function MoneyBag3D() {
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
      <ellipse cx="80" cy="148" rx="40" ry="6" fill="#D1D5DB" opacity="0.4" />

      {/* Bag body */}
      <path d="M40 70 Q40 140 80 145 Q120 140 120 70 Z" fill="url(#bagGrad)" />
      <path d="M40 70 Q40 140 80 145 Q120 140 120 70 Z" fill="url(#bagShine)" opacity="0.3" />

      {/* Bag neck tie */}
      <path d="M65 55 Q80 45 95 55" stroke="#92400E" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="50" r="5" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />

      {/* Bag top ruffle */}
      <path d="M60 55 Q62 35 70 30 Q75 28 80 32 Q85 28 90 30 Q98 35 100 55" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />

      {/* Naira symbol */}
      <text x="80" y="110" textAnchor="middle" fill="#92400E" fontSize="28" fontFamily="system-ui" fontWeight="bold" opacity="0.3">₦</text>

      {/* Stitching */}
      <path d="M50 80 Q80 95 110 80" stroke="#D97706" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />

      {/* Coins around */}
      <circle cx="130" cy="80" r="8" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" />
      <text x="130" y="83" textAnchor="middle" fill="#92400E" fontSize="6" fontFamily="system-ui" fontWeight="bold">₦</text>

      <circle cx="28" cy="90" r="7" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" opacity="0.7" />
      <text x="28" y="93" textAnchor="middle" fill="#92400E" fontSize="5" fontFamily="system-ui" fontWeight="bold">₦</text>

      <defs>
        <linearGradient id="bagGrad" x1="40" y1="70" x2="120" y2="145">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="bagShine" x1="40" y1="70" x2="120" y2="145">
          <stop offset="0%" stopColor="white" />
          <stop offset="40%" stopColor="transparent" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Dashboard() {
  const { user, updateUser } = useAuthStore()
  const [recentTips, setRecentTips] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api<any>('/tips/me').then((data) => {
      const tips = data.tips || []
      setRecentTips(tips.slice(0, 5))
    }).catch(() => {
      setRecentTips([])
    })

    api<any>('/auth/me').then((data) => {
      if (data?.user) updateUser(data.user)
    }).catch(() => {})
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.host}/${user?.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Dashboard</p>
          <h1 className="text-xl font-bold text-dark-text mt-0.5">Welcome, {user?.displayName?.split(' ')[0]}</h1>
        </div>
        <button onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200/60 text-gray-500 hover:text-dark-text hover:border-gray-300 transition-all text-xs font-medium shadow-sm">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Share'}
        </button>
      </motion.div>

      {/* Hero Card - Wallet + Tip Link */}
      <motion.div variants={fadeUp}
        className="relative overflow-hidden rounded-3xl bg-white border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left - Info */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Your Tip Link</p>
            <p className="text-xl sm:text-2xl font-black text-dark-text font-mono-nums tracking-tight">{window.location.host}/{user?.username}</p>
            <p className="text-sm text-gray-400 mt-2">Share this link to start receiving tips instantly.</p>
            <div className="flex gap-2 mt-4">
              <Link to={`/${user?.username}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover active:scale-[0.97] transition-all shadow-md shadow-blue-500/20">
                View Page <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {/* Right - 3D Wallet */}
          <div className="hidden sm:flex w-44 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
            <Wallet3D />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tips', value: Number(user?.totalTipsReceived || 0), icon: ArrowDownLeft, bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { label: 'Earned', value: formatNaira(Number(user?.totalAmount || 0)), icon: TrendingUp, bg: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25' },
          { label: 'Rating', value: `${Number(user?.rating || 0).toFixed(1)}`, icon: Star, bg: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/25' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.bg} p-4 text-white shadow-lg ${s.shadow} cursor-default`}>
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10" />
            <div className="absolute -bottom-2 -left-2 h-10 w-10 rounded-full bg-white/10" />
            <div className="relative">
              <s.icon className="h-5 w-5 text-white/80" />
              <p className="text-2xl font-black mt-2 font-mono-nums">{s.value}</p>
              <p className="text-xs text-white/70 font-medium mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions - 3D tilt style */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
        <Link to="/dashboard/withdraw" className="group">
          <motion.div whileHover={{ y: -3, rotateX: 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-dark-text">Withdraw</p>
                <p className="text-xs text-gray-400">Cash out earnings</p>
              </div>
            </div>
          </motion.div>
        </Link>
        <Link to="/dashboard/tips" className="group">
          <motion.div whileHover={{ y: -3, rotateX: 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-dark-text">View Tips</p>
                <p className="text-xs text-gray-400">See history</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Recent Tips */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-dark-text">Recent Tips</h2>
          {recentTips.length > 0 && (
            <Link to="/dashboard/tips" className="text-xs text-accent hover:text-accent-hover transition-colors font-semibold">View all →</Link>
          )}
        </div>
        <div className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {recentTips.length === 0 ? (
            <div className="py-10 flex flex-col items-center">
              <TipJar3D />
              <p className="text-sm font-bold text-dark-text mt-2">No tips yet</p>
              <p className="text-xs text-gray-400 mt-1">Share your link to start receiving</p>
            </div>
          ) : (
            <div>
              {recentTips.slice(0, 5).map((tip: any, i: number) => (
                <motion.div key={tip.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    i < recentTips.length - 1 ? 'border-b border-gray-100' : ''
                  } hover:bg-gray-50/50 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/20">
                      {(tip.sender?.displayName || 'A')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark-text">{tip.sender?.displayName || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{tip.category || 'General'} · {timeAgo(tip.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-accent font-mono-nums">+{formatNaira(tip.amount)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
