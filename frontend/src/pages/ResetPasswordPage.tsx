import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { api, ApiError } from '~/lib/api'
import { useUIStore } from '~/lib/store'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return addToast('error', 'Passwords do not match')
    setLoading(true)
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } })
      setSuccess(true)
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center pattern-wallet py-8">
        <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          <div className="w-full lg:w-[42%] max-w-[380px]">
            <Link to="/" className="flex items-center gap-2 w-fit mb-8">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center"><NairaCoinIcon className="h-4 w-4 text-white" /></div>
              <span className="text-lg font-bold tracking-tight text-dark-text">tipfy</span>
            </Link>
            <h1 className="text-2xl font-bold text-dark-text">Invalid link</h1>
            <p className="text-sm text-gray-500 mt-2">This password reset link is invalid or missing a token.</p>
            <Link to="/forgot-password">
              <Button fullWidth className="mt-6">Request a new link</Button>
            </Link>
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-center h-[480px]" />
        </div>
      </div>
    )
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

          {success ? (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-dark-text">Password reset</h1>
              <p className="text-sm text-gray-500 mt-2">
                Your password has been updated successfully. You can now log in with your new password.
              </p>
              <Button fullWidth className="mt-6" onClick={() => navigate('/login')}>
                Go to login
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-dark-text">Set new password</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>

              <form onSubmit={handleSubmit} className="space-y-3 mt-6">
                <Input
                  light label="New password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-dark-text transition-colors">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  light label="Confirm password" type={showPassword ? 'text' : 'password'} placeholder="Repeat password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button type="submit" fullWidth loading={loading} className="mt-1">
                  {loading ? 'Resetting...' : 'Reset password'}
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

                  {/* Password reset form preview screen */}
                  <div className="h-full flex flex-col px-5 pb-[58px]">
                    <div className="pt-4 pb-3">
                      <p className="text-sm font-bold text-dark-text">New password</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Create a strong, unique password</p>
                    </div>

                    <div className="space-y-3">
                      <div className="w-full h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center px-3 gap-2">
                        <Lock className="h-3.5 w-3.5 text-gray-300" />
                        <div className="flex-1 flex items-center gap-[3px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-text" />
                        </div>
                        <Eye className="h-3.5 w-3.5 text-gray-300" />
                      </div>

                      <div className="w-full h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center px-3 gap-2">
                        <Lock className="h-3.5 w-3.5 text-gray-300" />
                        <p className="text-[10px] text-gray-300">Confirm password</p>
                      </div>

                      <div className="w-full h-9 rounded-xl bg-accent flex items-center justify-center mt-1">
                        <p className="text-[11px] font-semibold text-white">Reset password</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle className="h-2 w-2 text-success" />
                      </div>
                      <p className="text-[8px] text-gray-400">Passwords are encrypted and never stored in plain text</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating strength card */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -4 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
              className="absolute -left-[80px] top-[12%] w-[180px] bg-white rounded-2xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] z-10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-3 w-3 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-dark-text">Strong password</p>
                  <p className="text-[7px] text-gray-400">8+ characters</p>
                </div>
              </div>
              <div className="flex gap-1 mt-1">
                <div className="flex-1 h-1 rounded-full bg-success" />
                <div className="flex-1 h-1 rounded-full bg-success" />
                <div className="flex-1 h-1 rounded-full bg-success" />
                <div className="flex-1 h-1 rounded-full bg-success" />
              </div>
            </motion.div>

            {/* Floating success card */}
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
                <p className="text-[9px] font-semibold text-dark-text">All set!</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">You're ready to log in</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
