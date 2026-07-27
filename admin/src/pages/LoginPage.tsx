import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { api, ApiError, setToken } from '~/lib/api'
import { useAuthStore, useUIStore } from '~/lib/store'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth, isAuthenticated } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)

  if (isAuthenticated) return <Navigate to="/admin" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return addToast('error', 'Fill in all fields')
    setLoading(true)
    try {
      const res = await api<{ token: string; user: any }>('/auth/login', { method: 'POST', body: { email, password } })
      if (res.user.role !== 'admin' && res.user.role !== 'support') {
        addToast('error', 'Access denied. Admin or support role required.')
        return
      }
      setToken(res.token)
      setAuth(res.user, res.token)
      addToast('success', 'Welcome back')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
            <NairaCoinIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-dark-text">tipfy Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access the admin panel</p>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
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
        </div>
      </motion.div>
    </div>
  )
}
