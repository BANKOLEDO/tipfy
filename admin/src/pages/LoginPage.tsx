import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { api, ApiError, setToken } from '~/lib/api'
import { useAuthStore, useUIStore } from '~/lib/store'

interface LoginResponse {
  requiresOtp?: boolean
  email?: string
  token?: string
  user?: any
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const { setAuth, isAuthenticated } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)

  if (isAuthenticated) return <Navigate to="/admin" replace />

  const login = async (creds: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await api<LoginResponse>('/auth/login', { method: 'POST', body: creds })
    if (res.requiresOtp) {
      return res
    }
    if (res.user?.role !== 'admin' && res.user?.role !== 'support') {
      throw new ApiError('Access denied. Admin or support role required.', 403, 'FORBIDDEN')
    }
    setToken(res.token!)
    setAuth(res.user, res.token!)
    addToast('success', 'Welcome back')
    return res
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return addToast('error', 'Fill in all fields')
    setLoading(true)
    try {
      const res = await login({ email, password })
      if (res.requiresOtp) {
        setOtpStep(true)
        addToast('success', 'Code sent — check your email')
      }
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Login failed')
    } finally { setLoading(false) }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) return addToast('error', 'Enter the 6-digit code')
    setLoading(true)
    try {
      const res = await api<LoginResponse>('/auth/login/verify-otp', { method: 'POST', body: { email, otp } })
      if (res.token && res.user) {
        setToken(res.token)
        setAuth(res.user, res.token)
        addToast('success', 'Verified — welcome back')
      }
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Verification failed')
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setOtpSending(true)
    try {
      await login({ email, password })
      setOtp('')
      addToast('success', 'New code sent — check your email')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Could not resend code')
    } finally { setOtpSending(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
            <NairaCoinIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-dark-text">tipfy Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            {otpStep ? 'Enter the code sent to your email' : 'Sign in to access the admin panel'}
          </p>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {!otpStep ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@tipfy.app"
                  className="w-full h-12 px-4 text-sm bg-gray-50 border-2 border-gray-100 rounded-2xl text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full h-12 px-4 pr-10 text-sm bg-gray-50 border-2 border-gray-100 rounded-2xl text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark-text">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-13 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100">
                <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-dark-text">Two-step verification</p>
                  <p className="text-gray-500 mt-0.5">Code sent to {email}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">6-digit code</label>
                <input type="text" inputMode="numeric" autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••"
                  className="w-full h-12 px-4 text-center text-xl tracking-[0.6em] font-bold font-mono-nums bg-gray-50 border-2 border-gray-100 rounded-2xl text-dark-text placeholder:text-gray-300 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-13 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setOtpStep(false); setOtp('') }}
                  className="inline-flex items-center gap-1 text-gray-400 hover:text-dark-text transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button type="button" onClick={handleResend} disabled={otpSending}
                  className="text-accent font-semibold hover:underline disabled:opacity-50">
                  {otpSending ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
