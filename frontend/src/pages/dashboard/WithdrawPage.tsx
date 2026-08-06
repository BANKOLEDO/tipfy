import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock, CheckCircle, XCircle, Building2, Loader2, ShieldCheck, KeyRound, Mail, BadgeCheck, AlertTriangle } from 'lucide-react'
import { api, ApiError } from '~/lib/api'
import { useAuthStore, useUIStore } from '~/lib/store'
import { formatNaira, timeAgo } from '~/lib/utils'
import { BANKS } from '~/config/constants'
import PinInput from '~/components/PinInput'

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
  const { user, updateUser } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [setupStep, setSetupStep] = useState<'idle' | 'otp-sent'>('idle')
  const [otp, setOtp] = useState('')
  const [newPin, setNewPin] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [settingPin, setSettingPin] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [accountStatus, setAccountStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [withdrawalFee, setWithdrawalFee] = useState(0)
  const [monthlyWithdrawals, setMonthlyWithdrawals] = useState(0)
  const [freePerMonth, setFreePerMonth] = useState(3)
  const addToast = useUIStore((s) => s.addToast)
  const checkRef = useRef(0)

  const hasPin = Boolean(user?.hasWithdrawalPin)
  const maxAmount = Math.floor(Number(user?.totalAmount || 0))
  const quickAmounts = [1000, 5000, 10000, 20000]
  const amt = parseInt(amount)
  const netAmount = amt && !isNaN(amt) && amt > 0 ? Math.max(0, amt - withdrawalFee) : 0

  useEffect(() => {
    api<any>('/withdrawals').then((data) => {
      const list = Array.isArray(data) ? data : data.withdrawals || []
      setWithdrawals(list)
      if (!Array.isArray(data)) {
        setWithdrawalFee(Number(data.withdrawalFee || 0))
        setMonthlyWithdrawals(Number(data.monthlyWithdrawals || 0))
        setFreePerMonth(Number(data.freeWithdrawalsPerMonth || 3))
      }
    }).catch(() => {})
  }, [])

  // Resend OTP countdown
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  // Debounced Monnify name enquiry so the user can confirm their account before submitting
  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) {
      setAccountName(null)
      setAccountStatus('idle')
      return
    }
    setAccountStatus('checking')
    const id = ++checkRef.current
    const t = setTimeout(async () => {
      try {
        const res = await api<{ accountName: string }>('/withdrawals/validate-account', {
          method: 'POST',
          body: { bankCode, accountNumber },
        })
        if (checkRef.current === id) {
          setAccountName(res.accountName)
          setAccountStatus('ok')
        }
      } catch {
        if (checkRef.current === id) {
          setAccountName(null)
          setAccountStatus('error')
        }
      }
    }, 600)
    return () => clearTimeout(t)
  }, [accountNumber, bankCode])

  const handleSendOtp = async () => {
    setSendingOtp(true)
    try {
      await api('/auth/withdrawal-pin/send-otp', { method: 'POST' })
      setSetupStep('otp-sent')
      setResendIn(60)
      addToast('success', 'Verification code sent to your email')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Could not send code')
    } finally { setSendingOtp(false) }
  }

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return addToast('error', 'Enter the 6-digit code from your email')
    if (newPin.length !== 4) return addToast('error', 'PIN must be exactly 4 digits')
    setSettingPin(true)
    try {
      await api('/auth/withdrawal-pin', { method: 'POST', body: { otp, pin: newPin } })
      updateUser({ hasWithdrawalPin: true })
      addToast('success', 'Withdrawal PIN set successfully')
      setOtp(''); setNewPin(''); setSetupStep('idle')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Could not set PIN')
    } finally { setSettingPin(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseInt(amount)
    if (!amt || amt <= 0) return addToast('error', 'Enter a valid amount')
    if (amt > maxAmount) return addToast('error', `Amount exceeds your available balance`)
    if (!bankCode) return addToast('error', 'Select a bank')
    if (accountNumber.length !== 10) return addToast('error', 'Enter a valid 10-digit account number')
    if (accountStatus === 'error') return addToast('error', 'Account could not be verified. Check the bank and account number.')
    if (accountStatus !== 'ok') return addToast('error', 'Wait for your account to be verified')
    if (pin.length !== 4) return addToast('error', 'Enter your 4-digit withdrawal PIN')
    setLoading(true)
    try {
      await api('/withdrawals', { method: 'POST', body: { amount: amt, bankCode, accountNumber, pin } })
      addToast('success', 'Withdrawal submitted!')
      setAmount(''); setAccountNumber(''); setBankCode(''); setPin(''); setAccountName(null); setAccountStatus('idle')
      api<any>('/withdrawals').then((data) => setWithdrawals(Array.isArray(data) ? data : data.withdrawals || [])).catch(() => {})
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Withdrawal failed')
    } finally { setLoading(false) }
  }

  const statusIcon = (s: string) => s === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : s === 'processing' ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" /> : s === 'pending' ? <Clock className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  const inputClass = "w-full h-12 px-4 text-sm bg-gray-50 border-2 border-gray-100 rounded-2xl text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
  const primaryBtn = "w-full h-12 bg-gradient-to-r from-accent to-blue-600 text-white rounded-2xl text-sm font-bold hover:from-accent-hover hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
      <motion.div variants={fadeUp}>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Funds</p>
        <h1 className="text-xl font-bold text-dark-text mt-0.5">Withdraw</h1>
      </motion.div>

      {/* Balance Hero */}
      <motion.div variants={fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 p-6 text-white shadow-xl shadow-emerald-500/20">
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
            <p className="text-4xl font-black mt-1 font-mono-nums tracking-tight">{formatNaira(maxAmount)}</p>
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
        {/* Withdrawal Form / PIN Setup */}
        <motion.div variants={fadeUp} className="lg:col-span-3 rounded-3xl bg-white border border-gray-200/60 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {!hasPin ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-dark-text">Secure your withdrawals</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Set a 4-digit PIN to protect your funds</p>
                </div>
              </div>

              {setupStep === 'idle' ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-accent" />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      We'll send a one-time code to <span className="font-semibold text-gray-700">{user?.email}</span>.
                      Enter it along with a new 4-digit PIN to finish setup.
                    </p>
                  </div>
                  <motion.button type="button" onClick={handleSendOtp} disabled={sendingOtp} whileTap={{ scale: 0.98 }}
                    className={primaryBtn}>
                    {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    {sendingOtp ? 'Sending code...' : 'Send verification code'}
                  </motion.button>
                </div>
              ) : (
                <form onSubmit={handleSetPin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Verification Code</label>
                    <input inputMode="numeric" maxLength={6} placeholder="6-digit code" value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className={`${inputClass} font-mono-nums tracking-[0.2em] text-center text-lg`} />
                    <p className="text-[11px] text-gray-400 mt-1.5">Sent to <span className="font-semibold text-gray-600">{user?.email}</span></p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-3">New PIN</label>
                    <PinInput value={newPin} onChange={setNewPin} autoFocus />
                    <p className="text-[11px] text-gray-400 mt-2 text-center">You'll enter this PIN every time you withdraw</p>
                  </div>
                  <div className="flex gap-3">
                    <motion.button type="submit" disabled={settingPin} whileTap={{ scale: 0.98 }}
                      className={`${primaryBtn} flex-1`}>
                      {settingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {settingPin ? 'Setting PIN...' : 'Confirm PIN'}
                    </motion.button>
                    <button type="button" onClick={handleSendOtp} disabled={sendingOtp || resendIn > 0}
                      className="h-12 px-4 text-xs font-bold text-accent hover:bg-accent/5 rounded-xl transition-colors disabled:opacity-40">
                      {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
          <div>
            <h2 className="text-base font-bold text-dark-text mb-5">New Withdrawal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">₦</span>
                  <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className={`${inputClass} pl-10 font-mono-nums text-xl font-bold`} />
                </div>
                <div className="flex gap-2 flex-wrap mt-2.5">
                  {quickAmounts.map((v) => (
                    <button type="button" key={v} onClick={() => setAmount(String(v))}
                      className={`px-3 h-8 rounded-xl text-xs font-bold border transition-all ${
                        amount === String(v) ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'
                      }`}>
                      {formatNaira(v)}
                    </button>
                  ))}
                  {maxAmount >= 1000 && (
                    <button type="button" onClick={() => setAmount(String(maxAmount))}
                      className="px-3 h-8 rounded-xl text-xs font-bold bg-gray-50 border border-gray-100 text-gray-500 hover:border-gray-300 transition-all">
                      Max {formatNaira(maxAmount)}
                    </button>
                  )}
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
                {accountStatus === 'checking' && (
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Verifying account...
                  </p>
                )}
                {accountStatus === 'ok' && accountName && (
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mt-1.5">
                    <BadgeCheck className="h-3.5 w-3.5" /> {accountName}
                  </p>
                )}
                {accountStatus === 'error' && (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 mt-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Account could not be verified
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-3">Withdrawal PIN</label>
                <PinInput value={pin} onChange={setPin} />
              </div>

              {amt > 0 && (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Amount</span>
                    <span className="font-semibold text-dark-text font-mono-nums">{formatNaira(amt)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Withdrawal fee{withdrawalFee === 0 && <span className="text-emerald-600 font-semibold"> (free)</span>}</span>
                    <span className={`font-semibold font-mono-nums ${withdrawalFee === 0 ? 'text-emerald-600' : 'text-dark-text'}`}>
                      {withdrawalFee === 0 ? formatNaira(0) : formatNaira(withdrawalFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Withholding tax <span className="font-normal">(up to 5%)</span></span>
                    <span className="font-semibold font-mono-nums text-amber-600">up to {formatNaira(Math.round(netAmount * 0.05 * 100) / 100)}</span>
                  </div>
                  <div className="h-px bg-gray-200/70" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-dark-text">You receive</span>
                    <span className="text-base font-bold text-emerald-600 font-mono-nums">{formatNaira(netAmount)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1 leading-relaxed">
                    {withdrawalFee > 0 && <>First {freePerMonth} withdrawals each month are free{monthlyWithdrawals >= freePerMonth ? ` — you've used all ${monthlyWithdrawals}` : ''}. A fee applies to this withdrawal.{' '}</>}
                    WHT is deducted by your bank/FIRS at source where applicable and may reduce the amount that lands.
                  </p>
                </div>
              )}

              <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                className="w-full h-13 bg-gradient-to-r from-accent to-blue-600 text-white rounded-2xl text-sm font-bold hover:from-accent-hover hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                <ArrowUpRight className="h-4 w-4" />
                {loading ? 'Processing...' : 'Withdraw Funds'}
              </motion.button>
            </form>
          </div>
          )}
        </motion.div>

        {/* History + Illustration */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl bg-white border border-gray-200/60 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-bold text-dark-text mb-3">History</h2>
            {withdrawals.length === 0 ? (
              <div className="py-6 flex flex-col items-center">
                <MoneyBag3D />
                <p className="text-xs text-gray-400 mt-2">Your withdrawals will appear here</p>
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
                      w.status === 'processing' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
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
