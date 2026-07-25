import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, ExternalLink, MapPin, Calendar, Mail, Link2, UserCircle, Briefcase, ArrowUpRight, Download } from 'lucide-react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { api, ApiError } from '~/lib/api'
import { useAuthStore, useUIStore } from '~/lib/store'
import { Avatar } from '~/components/ui/Avatar'
import { BUSINESS_CATEGORIES } from '~/config/constants'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const [copied, setCopied] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '', username: user?.username || '', bio: user?.bio || '', location: user?.location || '',
  })
  const [business, setBusiness] = useState({
    isBusiness: user?.isBusiness || false, businessName: user?.businessName || '', businessCategory: user?.businessCategory || '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api<any>('/users/profile', { method: 'PUT', body: { ...profile, ...business } })
      if (res?.user) updateUser(res.user)
      addToast('success', 'Settings saved!')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${user?.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tipUrl = `${window.location.origin}/${user?.username}`

  const downloadQR = () => {
    const qrCanvas = qrCanvasRef.current
    if (!qrCanvas) return

    const W = 400, H = 520, S = 2
    const canvas = document.createElement('canvas')
    canvas.width = W * S
    canvas.height = H * S
    const ctx = canvas.getContext('2d')!
    ctx.scale(S, S)

    // Background
    ctx.fillStyle = '#F8F6F3'
    ctx.fillRect(0, 0, W, H)

    // Dot pattern
    ctx.fillStyle = 'rgba(0,0,0,0.03)'
    for (let x = 12; x < W; x += 24) {
      for (let y = 12; y < H; y += 24) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // White card
    const cr = 16, cx = 20, cy = 20, cw = W - 40, ch = H - 40
    ctx.beginPath()
    ctx.moveTo(cx + cr, cy)
    ctx.lineTo(cx + cw - cr, cy)
    ctx.quadraticCurveTo(cx + cw, cy, cx + cw, cy + cr)
    ctx.lineTo(cx + cw, cy + ch - cr)
    ctx.quadraticCurveTo(cx + cw, cy + ch, cx + cw - cr, cy + ch)
    ctx.lineTo(cx + cr, cy + ch)
    ctx.quadraticCurveTo(cx, cy + ch, cx, cy + ch - cr)
    ctx.lineTo(cx, cy + cr)
    ctx.quadraticCurveTo(cx, cy, cx + cr, cy)
    ctx.closePath()
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.stroke()

    // Blue accent bar
    const barR = 3
    ctx.beginPath()
    ctx.moveTo(20 + barR, 20)
    ctx.lineTo(W - 20 - barR, 20)
    ctx.quadraticCurveTo(W - 20, 20, W - 20, 20 + barR)
    ctx.lineTo(W - 20, 20 + 6 - barR)
    ctx.quadraticCurveTo(W - 20, 26, W - 20 - barR, 26)
    ctx.lineTo(20 + barR, 26)
    ctx.quadraticCurveTo(20, 26, 20, 26 - barR)
    ctx.lineTo(20, 20 + barR)
    ctx.quadraticCurveTo(20, 20, 20 + barR, 20)
    ctx.closePath()
    const grad = ctx.createLinearGradient(20, 20, W - 20, 26)
    grad.addColorStop(0, '#2563EB')
    grad.addColorStop(1, '#3B82F6')
    ctx.fillStyle = grad
    ctx.fill()

    // Logo square
    const logoX = 32, logoY = 52, logoS = 28
    ctx.fillStyle = '#2563EB'
    roundRect(ctx, logoX, logoY, logoS, logoS, 7)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('\u20A6', logoX + logoS / 2, logoY + logoS / 2 + 5)

    // tipfy wordmark
    ctx.fillStyle = '#1A1A2E'
    ctx.font = '800 17px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText('tipfy', logoX + logoS + 8, logoY + logoS / 2 + 6)

    // User name
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1A1A2E'
    ctx.font = '700 16px system-ui'
    ctx.fillText(user?.displayName || '', W / 2, 112)

    // Username
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '500 12px system-ui'
    ctx.fillText('@' + (user?.username || ''), W / 2, 132)

    // Draw QR code — centered, large
    const qrDrawSize = 280
    const qrX = (W - qrDrawSize) / 2
    const qrY = 155
    ctx.drawImage(qrCanvas, 0, 0, qrCanvas.width, qrCanvas.height, qrX, qrY, qrDrawSize, qrDrawSize)

    // URL bar
    const urlBarY = H - 80, urlBarH = 32, urlBarR = 8
    ctx.fillStyle = '#F3F4F6'
    roundRect(ctx, 52, urlBarY, W - 104, urlBarH, urlBarR)
    ctx.fill()
    ctx.fillStyle = '#2563EB'
    ctx.font = '600 12px SF Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(window.location.host + '/' + (user?.username || ''), W / 2, urlBarY + urlBarH / 2 + 4)

    // Powered by
    ctx.fillStyle = '#D1D5DB'
    ctx.font = '500 10px system-ui'
    ctx.fillText('Powered by tipfy', W / 2, H - 36)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tipfy-${user?.username}-qr.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const inputClass = "w-full h-11 px-4 text-sm bg-white border border-gray-200 rounded-xl text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5"

  return (
    <form onSubmit={handleSave}>
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className="mb-6">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Account</p>
          <h1 className="text-xl font-bold text-dark-text mt-0.5">Settings</h1>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left — Profile Card */}
          <motion.div variants={fadeUp}
            className="lg:sticky lg:top-20 w-full lg:w-72 xl:w-80 shrink-0 rounded-2xl bg-white border border-gray-200/60 shadow-sm overflow-hidden">
            {/* Banner */}
            <div className="relative h-24 bg-gradient-to-br from-accent via-blue-500 to-indigo-600 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_70%)]" />
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute top-3 left-4 h-3 w-8 rounded-full bg-white/15" />
            </div>

            <div className="px-5 -mt-10 pb-5 relative">
              <div className="relative inline-block">
                <Avatar name={user?.displayName || 'User'} size="xl" className="ring-4 ring-white shadow-md" />
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-emerald-500 border-[3px] border-white" />
              </div>

              <h2 className="text-base font-bold text-dark-text mt-2.5">{user?.displayName}</h2>
              <p className="text-sm text-gray-400 font-medium">@{user?.username}</p>

              {user?.bio && (
                <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">{user.bio}</p>
              )}

              <div className="mt-3.5 space-y-2">
                {user?.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.createdAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short' })}</span>
                  </div>
                )}
              </div>

              <div className="my-4 h-px bg-gray-100" />

              {/* Tip Link */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tip Link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-9 px-3 flex items-center bg-accent/5 border border-accent/10 rounded-lg min-w-0">
                  <Link2 className="h-3 w-3 text-accent shrink-0 mr-1.5" />
                  <span className="text-[13px] font-semibold text-accent font-mono-nums truncate">{window.location.host}/{user?.username}</span>
                </div>
                <button type="button" onClick={copyLink}
                  className="h-9 px-3 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              <a href={`/${user?.username}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-3 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-400 hover:text-accent hover:border-accent/30 transition-all">
                View public profile
                <ArrowUpRight className="h-3 w-3" />
              </a>

              <div className="my-4 h-px bg-gray-100" />

              {/* QR Code */}
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm shrink-0">
                  <QRCodeSVG
                    id="tip-qr"
                    value={tipUrl}
                    size={88}
                    bgColor="white"
                    fgColor="#1A1A2E"
                    level="M"
                  />
                </div>
                {/* Hidden QR canvas for download — never rendered visually */}
                <div className="absolute" style={{ left: '-9999px', top: '-9999px' }}>
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={tipUrl}
                    size={560}
                    bgColor="transparent"
                    fgColor="#1A1A2E"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-xs font-semibold text-dark-text">Your QR Code</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">Print it, share it, stick it on your shop.</p>
                  <button type="button" onClick={downloadQR}
                    className="mt-2.5 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-all">
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — Form fields */}
          <div className="w-full flex-1 min-w-0 space-y-5 pb-24 lg:pb-0">
            {/* Profile */}
            <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <UserCircle className="h-4 w-4 text-accent" />
                </div>
                <p className="text-sm font-semibold text-dark-text">Profile</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Display Name</label>
                    <input value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Username</label>
                    <input value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    maxLength={300} rows={3}
                    className={`${inputClass} resize-none`} />
                  <p className="text-[10px] text-gray-400 mt-1">{profile.bio.length}/300</p>
                </div>
                <div className="sm:max-w-xs">
                  <label className={labelClass}>Location</label>
                  <input value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Lagos, Nigeria" className={inputClass} />
                </div>
              </div>
            </motion.div>

            {/* Business */}
            <motion.div variants={fadeUp} className="rounded-2xl bg-white border border-gray-200/60 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Briefcase className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-dark-text">Business</p>
                </div>
                <button type="button" onClick={() => setBusiness((b) => ({ ...b, isBusiness: !b.isBusiness }))}
                  className={`w-10 h-[22px] rounded-full transition-all duration-200 relative ${business.isBusiness ? 'bg-accent' : 'bg-gray-300'}`}>
                  <motion.div animate={{ x: business.isBusiness ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <AnimatePresence>
                {business.isBusiness ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="p-5 space-y-4 overflow-hidden">
                    <div className="sm:max-w-sm">
                      <label className={labelClass}>Business Name</label>
                      <input value={business.businessName} onChange={(e) => setBusiness((b) => ({ ...b, businessName: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div className="sm:max-w-sm">
                      <label className={labelClass}>Category</label>
                      <select value={business.businessCategory} onChange={(e) => setBusiness((b) => ({ ...b, businessCategory: e.target.value }))}
                        className={`${inputClass} appearance-none`}>
                        <option value="">Select category</option>
                        {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 py-4">
                    <p className="text-sm text-gray-400">Enable business mode to add your business details.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Desktop save */}
            <motion.div variants={fadeUp} className="hidden lg:flex items-center justify-between">
              <p className="text-xs text-gray-400">Changes are saved to your public profile.</p>
              <button type="submit" disabled={saving}
                className="h-10 px-6 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm shadow-blue-500/20">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Mobile fixed save bar */}
        <div className="fixed bottom-[76px] left-4 right-4 z-30 lg:hidden">
          <button type="submit" disabled={saving}
            className="w-full h-12 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </form>
  )
}
