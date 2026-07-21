import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, AtSign, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { api, ApiError, setToken } from '~/lib/api'
import { useAuthStore } from '~/lib/store'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      const data = await api('/auth/register', { method: 'POST', body: { displayName: form.displayName, username: form.username, email: form.email, password: form.password } }) as any
      setToken(data.token)
      setAuth(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
    } finally { setLoading(false) }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-light flex items-center justify-center pattern-coins py-8">
      <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">

        {/* Left — form */}
        <div className="w-full lg:w-[42%] max-w-[380px]">
          <Link to="/" className="flex items-center gap-2 w-fit mb-8">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center"><Zap className="h-4 w-4 text-white" /></div>
            <span className="text-lg font-bold tracking-tight text-dark-text">tipfy</span>
          </Link>

          <h1 className="text-2xl font-bold text-dark-text">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Your tip page is one sign-up away</p>

          {error && (
            <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 mt-6">
            <Input light label="Full name" placeholder="John Doe" leftIcon={<User className="h-4 w-4" />} value={form.displayName} onChange={update('displayName')} />
            <Input light label="Username" placeholder="johndoe" leftIcon={<AtSign className="h-4 w-4" />} value={form.username} onChange={update('username')} helper={`Your tip link: ${window.location.host}/johndoe`} />
            <Input light label="Email" type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} value={form.email} onChange={update('email')} />
            <Input
              light label="Password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-dark-text transition-colors">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
              value={form.password} onChange={update('password')}
            />
            <Input light label="Confirm password" type={showPassword ? 'text' : 'password'} placeholder="Repeat password" leftIcon={<Lock className="h-4 w-4" />} value={form.confirmPassword} onChange={update('confirmPassword')} />

            <Button type="submit" fullWidth loading={loading} className="mt-1">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-[11px] text-gray-400 mt-5">
            By signing up, you agree to our <Link to="/terms" className="text-gray-500 underline underline-offset-2">Terms</Link> and <Link to="/privacy" className="text-gray-500 underline underline-offset-2">Privacy</Link>
          </p>

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <Link to="/login" className="text-xs text-gray-500 hover:text-dark-text transition-colors">
              Already have an account? <span className="text-accent font-medium">Log in</span>
            </Link>
          </div>
        </div>

        {/* Right — phone mockup (matches CTA section) */}
        <div className="hidden lg:flex flex-1 items-center justify-center h-[480px]">
          <div className="relative">
            {/* Shadow underneath phone */}
            <div className="absolute left-1/2 top-[60%] -translate-x-1/2 w-[220px] h-[30px] bg-black/[0.08] rounded-[50%] blur-2xl" />

            {/* Realistic phone body */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="relative"
            >
              {/* Phone frame */}
              <div className="relative w-[250px] h-[510px] rounded-[44px] bg-[#1A1A1A] p-[10px] shadow-[0_24px_80px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]">
                {/* Side buttons */}
                <div className="absolute -left-[2px] top-[115px] w-[3px] h-[28px] bg-[#333] rounded-l-sm" />
                <div className="absolute -left-[2px] top-[155px] w-[3px] h-[48px] bg-[#333] rounded-l-sm" />
                <div className="absolute -left-[2px] top-[215px] w-[3px] h-[48px] bg-[#333] rounded-l-sm" />
                <div className="absolute -right-[2px] top-[175px] w-[3px] h-[60px] bg-[#333] rounded-r-sm" />

                {/* Screen */}
                <div className="relative w-full h-full rounded-[36px] bg-white overflow-hidden ring-[3px] ring-[#1A1A1A]">
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-[#1A1A1A] rounded-full z-20" />

                  {/* Status bar */}
                  <div className="relative z-10 flex items-center justify-between px-7 pt-3 pb-1">
                    <span className="text-[11px] font-semibold text-dark-text tracking-tight">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <svg viewBox="0 0 18 12" className="w-4 h-2.5 fill-dark-text"><rect x="0" y="7" width="3" height="5" rx="0.8"/><rect x="4" y="4.5" width="3" height="7.5" rx="0.8"/><rect x="8" y="2" width="3" height="10" rx="0.8"/><rect x="12" y="0" width="3" height="12" rx="0.8"/></svg>
                      <svg viewBox="0 0 18 12" className="w-4.5 h-3 fill-dark-text"><rect x="0.5" y="1" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.2"/><rect x="15" y="3.5" width="2" height="5" rx="0.8"/><rect x="2" y="2.8" width="10" height="6.4" rx="1.2" fill="currentColor"/></svg>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="h-full overflow-hidden pb-[58px]">
                    {/* App header */}
                    <div className="px-5 pt-3 pb-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-sm">
                            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-dark-text">tipfy</p>
                            <p className="text-[9px] text-gray-400 -mt-0.5">Dashboard</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Balance card */}
                    <div className="mx-4 bg-accent rounded-2xl p-4 shadow-sm">
                      <p className="text-[9px] text-white/60 uppercase tracking-wider font-medium">Total received</p>
                      <p className="text-[26px] font-bold text-white font-mono-nums mt-0.5 leading-tight">₦127,500</p>
                      <div className="inline-flex items-center gap-1 mt-2 bg-white/15 rounded-full px-2 py-0.5">
                        <p className="text-[9px] text-white font-medium">+18% this month</p>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2.5 mx-4 mt-3">
                      {[
                        { icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>, label: 'Receive' },
                        { icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, label: 'Withdraw' },
                        { icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>, label: 'Team' },
                      ].map((a) => (
                        <div key={a.label} className="flex-1 bg-gray-50 rounded-xl py-2.5 flex flex-col items-center gap-1">
                          <div className="text-gray-400">{a.icon}</div>
                          <p className="text-[8px] font-medium text-gray-500">{a.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recent tips */}
                    <div className="px-5 pt-4 pb-2">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] font-semibold text-dark-text uppercase tracking-wider">Recent tips</p>
                        <p className="text-[9px] text-accent font-medium">View all</p>
                      </div>
                      {[
                        { name: 'Chioma A.', amount: '₦5,000', time: '2m ago', msg: 'Great work!', color: 'bg-purple-100 text-purple-600', initials: 'CA' },
                        { name: 'Adebayo K.', amount: '₦2,000', time: '15m ago', msg: 'Thanks!', color: 'bg-blue-100 text-blue-600', initials: 'AK' },
                        { name: 'Fatima B.', amount: '₦10,000', time: '1h ago', msg: 'Keep going!', color: 'bg-emerald-100 text-emerald-600', initials: 'FB' },
                        { name: 'Chidi O.', amount: '₦1,500', time: '3h ago', msg: '', color: 'bg-amber-100 text-amber-600', initials: 'CO' },
                      ].map((tip, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${tip.color} flex items-center justify-center text-[9px] font-bold`}>{tip.initials}</div>
                            <div>
                              <p className="text-[10px] font-medium text-dark-text">{tip.name}</p>
                              <p className="text-[8px] text-gray-400">{tip.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-dark-text font-mono-nums">{tip.amount}</p>
                            {tip.msg && <p className="text-[7px] text-gray-300 italic">"{tip.msg}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="absolute bottom-0 left-0 right-0 h-[56px] bg-white border-t border-gray-100 flex items-center justify-around px-5 z-10">
                    {[
                      { icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Home', active: true },
                      { icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: 'Tips', active: false },
                      { icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Withdraw', active: false },
                      { icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, label: 'Settings', active: false },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center gap-0.5">
                        <div className={item.active ? 'text-accent' : 'text-gray-300'}>{item.icon}</div>
                        <p className={`text-[7px] font-medium ${item.active ? 'text-accent' : 'text-gray-300'}`}>{item.label}</p>
                        {item.active && <div className="w-4 h-0.5 rounded bg-accent mt-0.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating tip notification card */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -4 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
              className="absolute -left-[80px] top-[12%] w-[180px] bg-white rounded-2xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] z-10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="#00B894" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3 3 7-7" /></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-dark-text">New tip!</p>
                  <p className="text-[7px] text-gray-400">Just now</p>
                </div>
              </div>
              <p className="text-lg font-bold text-accent font-mono-nums">₦5,000</p>
              <p className="text-[8px] text-gray-400 mt-0.5">From Adebayo K.</p>
            </motion.div>

            {/* Floating payout card */}
            <motion.div
              initial={{ opacity: 0, x: 20, rotate: 4 }}
              animate={{ opacity: 1, x: 0, rotate: 4 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 120 }}
              className="absolute -right-[70px] bottom-[10%] w-[165px] bg-white rounded-2xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] z-20"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="#00B894" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3 3 7-7" /></svg>
                </div>
                <p className="text-[9px] font-semibold text-dark-text">Paid out</p>
              </div>
              <p className="text-base font-bold text-dark-text font-mono-nums">₦8,500</p>
              <div className="flex items-center gap-1 mt-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                <p className="text-[8px] text-success font-medium">28 seconds</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
