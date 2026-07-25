import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Shield } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { api, ApiError } from '~/lib/api'
import { useUIStore } from '~/lib/store'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } })
      setSent(true)
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center pattern-wallet py-8">
      <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">

        {/* Left — form */}
        <div className="w-full lg:w-[42%] max-w-[380px]">
          <Link to="/" className="flex items-center gap-2 w-fit mb-8">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center"><NairaCoinIcon className="h-4 w-4 text-white" /></div>
            <span className="text-lg font-bold tracking-tight text-dark-text">tipfy</span>
          </Link>

          {sent ? (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-dark-text">Check your email</h1>
              <p className="text-sm text-gray-500 mt-2">
                We've sent a password reset link to <span className="font-medium text-dark-text">{email}</span>. It expires in 1 hour.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <Button variant="outline" fullWidth className="mt-6" onClick={() => setSent(false)}>
                Try another email
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-dark-text">Forgot your password?</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a reset link</p>

              <form onSubmit={handleSubmit} className="space-y-3 mt-6">
                <Input
                  light label="Email" type="email" placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" fullWidth loading={loading} className="mt-1">
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-dark-text transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </div>
        </div>

        {/* Right — phone mockup */}
        <div className="hidden lg:flex flex-1 items-center justify-center h-[480px]">
          <div className="relative">
            <div className="absolute left-1/2 top-[60%] -translate-x-1/2 w-[220px] h-[30px] bg-black/[0.08] rounded-[50%] blur-2xl" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="relative"
            >
              <div className="relative w-[250px] h-[510px] rounded-[44px] bg-[#1A1A1A] p-[10px] shadow-[0_24px_80px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="absolute -left-[2px] top-[115px] w-[3px] h-[28px] bg-[#333] rounded-l-sm" />
                <div className="absolute -left-[2px] top-[155px] w-[3px] h-[48px] bg-[#333] rounded-l-sm" />
                <div className="absolute -left-[2px] top-[215px] w-[3px] h-[48px] bg-[#333] rounded-l-sm" />
                <div className="absolute -right-[2px] top-[175px] w-[3px] h-[60px] bg-[#333] rounded-r-sm" />

                <div className="relative w-full h-full rounded-[36px] bg-white overflow-hidden ring-[3px] ring-[#1A1A1A]">
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-[#1A1A1A] rounded-full z-20" />

                  <div className="relative z-10 flex items-center justify-between px-7 pt-3 pb-1">
                    <span className="text-[11px] font-semibold text-dark-text tracking-tight">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <svg viewBox="0 0 18 12" className="w-4 h-2.5 fill-dark-text"><rect x="0" y="7" width="3" height="5" rx="0.8"/><rect x="4" y="4.5" width="3" height="7.5" rx="0.8"/><rect x="8" y="2" width="3" height="10" rx="0.8"/><rect x="12" y="0" width="3" height="12" rx="0.8"/></svg>
                      <svg viewBox="0 0 18 12" className="w-4.5 h-3 fill-dark-text"><rect x="0.5" y="1" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.2"/><rect x="15" y="3.5" width="2" height="5" rx="0.8"/><rect x="2" y="2.8" width="10" height="6.4" rx="1.2" fill="currentColor"/></svg>
                    </div>
                  </div>

                  {/* Reset email screen */}
                  <div className="h-full flex flex-col items-center justify-center px-6 pb-[58px]">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <Shield className="h-7 w-7 text-accent" />
                    </div>
                    <p className="text-sm font-bold text-dark-text text-center">Reset your password</p>
                    <p className="text-[10px] text-gray-400 text-center mt-1 leading-relaxed">A secure link has been sent to your email address</p>
                    <div className="w-full mt-5 space-y-2">
                      <div className="w-full h-2.5 rounded-full bg-gray-100" />
                      <div className="w-3/4 h-2.5 rounded-full bg-gray-100" />
                    </div>
                    <div className="w-full h-9 rounded-xl bg-accent mt-4 flex items-center justify-center">
                      <p className="text-[11px] font-semibold text-white">Open email app</p>
                    </div>
                    <p className="text-[9px] text-gray-300 mt-3 text-center">Link expires in 1 hour</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating security card */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -4 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
              className="absolute -left-[80px] top-[12%] w-[180px] bg-white rounded-2xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] z-10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <Shield className="h-3 w-3 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-dark-text">Secure reset</p>
                  <p className="text-[7px] text-gray-400">1-hour expiry</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">Your account stays protected with encrypted tokens</p>
            </motion.div>

            {/* Floating tip notification card */}
            <motion.div
              initial={{ opacity: 0, x: 20, rotate: 4 }}
              animate={{ opacity: 1, x: 0, rotate: 4 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 120 }}
              className="absolute -right-[70px] bottom-[10%] w-[165px] bg-white rounded-2xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] z-20"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle className="h-2.5 w-2.5 text-success" />
                </div>
                <p className="text-[9px] font-semibold text-dark-text">Safe & quick</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Back online in seconds</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
