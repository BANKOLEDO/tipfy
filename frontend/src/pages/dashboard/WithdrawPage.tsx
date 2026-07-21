import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Clock, CheckCircle, XCircle, Building2 } from 'lucide-react'
import { api, ApiError } from '~/lib/api'
import { useAuthStore } from '~/lib/store'
import { formatNaira, timeAgo } from '~/lib/utils'
import { BANKS } from '~/config/constants'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function MoneyBag3D() {
  return (
    <svg viewBox="0 0 160 160" className="w-16 h-16 sm:w-20 sm:h-20" fill="none">
      <ellipse cx="80" cy="148" rx="40" ry="6" fill="#D1D5DB" opacity="0.4" />
      <path d="M40 70 Q40 140 80 145 Q120 140 120 70 Z" fill="url(#bagGrad)" />
      <path d="M40 70 Q40 140 80 145 Q120 140 120 70 Z" fill="url(#bagShine)" opacity="0.3" />
      <path d="M65 55 Q80 45 95 55" stroke="#92400E" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="50" r="5" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
      <path d="M60 55 Q62 35 70 30 Q75 28 80 32 Q85 28 90 30 Q98 35 100 55" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
      <text x="80" y="110" textAnchor="middle" fill="#92400E" fontSize="28" fontFamily="system-ui" fontWeight="bold" opacity="0.3">₦</text>
      <path d="M50 80 Q80 95 110 80" stroke="#D97706" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
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

export default function WithdrawPage() {
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api<any>('/withdrawals').then((data) => setWithdrawals(Array.isArray(data) ? data : data.withdrawals || [])).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const amt = parseInt(amount)
    if (!amt || amt <= 0) return setMessage({ type: 'error', text: 'Enter a valid amount' })
    if (!bankCode) return setMessage({ type: 'error', text: 'Select a bank' })
    if (accountNumber.length !== 10) return setMessage({ type: 'error', text: 'Enter a valid 10-digit account number' })
    setLoading(true)
    try {
      await api('/withdrawals', { method: 'POST', body: { amount: amt, bankCode, accountNumber } })
      setMessage({ type: 'success', text: 'Withdrawal submitted!' })
      setAmount(''); setAccountNumber(''); setBankCode('')
    api<any>('/withdrawals').then((data) => setWithdrawals(Array.isArray(data) ? data : data.withdrawals || [])).catch(() => {})
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Withdrawal failed' })
    } finally { setLoading(false) }
  }

  const statusIcon = (s: string) => s === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : s === 'pending' ? <Clock className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  const inputClass = "w-full h-12 px-4 text-sm bg-gray-50 border-2 border-gray-100 rounded-2xl text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Funds</p>
        <h1 className="text-xl font-bold text-dark-text mt-0.5">Withdraw</h1>
      </motion.div>

      {/* Balance Hero */}
      <motion.div variants={fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 p-6 text-white shadow-xl shadow-emerald-500/20">
        {/* 3D Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.07]">
          <svg viewBox="0 0 160 160" fill="none">
            <circle cx="80" cy="80" r="70" stroke="white" strokeWidth="3" />
            <circle cx="80" cy="80" r="50" stroke="white" strokeWidth="2" />
            <circle cx="80" cy="80" r="30" stroke="white" strokeWidth="1.5" />
            <path d="M80 10v140M10 80h140" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 opacity-[0.07]">
          <svg viewBox="0 0 128 128" fill="none">
            <rect x="10" y="20" width="108" height="88" rx="10" stroke="white" strokeWidth="3" />
            <circle cx="100" cy="64" r="14" stroke="white" strokeWidth="2" />
          </svg>
        </div>
          <div className="relative flex items-end justify-between">
          <div>
            <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Available Balance</p>
            <p className="text-4xl font-black mt-1 font-mono-nums tracking-tight">{formatNaira(user?.totalAmount || 0)}</p>
          </div>
          <div className="mb-1">
            <svg viewBox="0 0 60 60" className="w-14 h-14" fill="none">
              <circle cx="30" cy="30" r="24" fill="white" opacity="0.15" />
              <circle cx="30" cy="30" r="18" fill="white" opacity="0.2" />
              <text x="30" y="36" textAnchor="middle" fill="white" fontSize="18" fontFamily="system-ui" fontWeight="bold">₦</text>
            </svg>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Withdrawal Form */}
        <motion.div variants={fadeUp} className="lg:col-span-3 rounded-3xl bg-white border border-gray-200/60 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <h2 className="text-base font-bold text-dark-text mb-5">New Withdrawal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">₦</span>
                <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className={`${inputClass} pl-10 font-mono-nums text-xl font-bold`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Bank</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
                  className={`${inputClass} pl-10 appearance-none`}>
                  <option value="">Select bank</option>
                  {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Account Number</label>
              <input placeholder="0123456789" maxLength={10} value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} font-mono-nums tracking-[0.2em] text-center text-lg`} />
            </div>

            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                  {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="w-full h-13 bg-gradient-to-r from-accent to-blue-600 text-white rounded-2xl text-sm font-bold hover:from-accent-hover hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
              <ArrowUpRight className="h-4 w-4" />
              {loading ? 'Processing...' : 'Withdraw Funds'}
            </motion.button>
          </form>
        </motion.div>

        {/* History + Illustration */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl bg-white border border-gray-200/60 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-bold text-dark-text mb-3">History</h2>
            {withdrawals.length === 0 ? (
              <div className="py-6 flex flex-col items-center">
                <MoneyBag3D />
                <p className="text-xs text-gray-400 mt-2">Your earnings will appear here</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {withdrawals.map((w, i) => (
                  <motion.div key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors ${
                      i < withdrawals.length - 1 ? 'border-b border-gray-100' : ''
                    }`}>
                    <div className="flex items-center gap-2.5">
                      {statusIcon(w.status)}
                      <div>
                        <p className="text-sm font-bold text-dark-text font-mono-nums">{formatNaira(w.amount)}</p>
                        <p className="text-[10px] text-gray-400">{timeAgo(w.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      w.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      w.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-red-50 text-red-600 border border-red-100'
                    }`}>{w.status}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
