import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CreditCard, ArrowLeft, Heart, Sparkles, Shield, ArrowRight, MessageCircle, Tag } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { api } from '~/lib/api'
import { useUIStore } from '~/lib/store'
import { formatNaira } from '~/lib/utils'
import { PRESET_AMOUNTS, TIP_CATEGORIES } from '~/config/constants'

export default function TipPage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const [recipient, setRecipient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'amount' | 'details' | 'processing' | 'success'>('amount')
  const [amount, setAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [processing, setProcessing] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      setError('No username provided. Use a link like your-domain.com/username')
      return
    }
    api<{ user: any; recentTips: any[] }>(`/users/${username}`).then((res) => setRecipient(res.user)).catch(() => setError('User not found')).finally(() => setLoading(false))
  }, [username])

  const selectedAmount = amount || (customAmount ? parseInt(customAmount) : 0)

  useEffect(() => {
    if (!selectedAmount || selectedAmount <= 0 || !recipient?.id) {
      setQuote(null)
      setQuoteLoading(false)
      return
    }
    setQuoteLoading(true)
    const t = setTimeout(() => {
      api<any>(`/tips/fees?recipientId=${recipient.id}&amount=${selectedAmount}`)
        .then((res) => setQuote(res?.fees || null))
        .catch(() => setQuote(null))
        .finally(() => setQuoteLoading(false))
    }, 350)
    return () => clearTimeout(t)
  }, [selectedAmount, recipient?.id])

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAmount || selectedAmount <= 0 || !recipient) return
    setStep('processing')
    setProcessing(true)
    try {
      const res = await api<any>('/tips', {
        method: 'POST', body: {
          recipientId: recipient.id, amount: selectedAmount, senderName: senderName || undefined, senderEmail, message: message || undefined, category,
        }
      })
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err) {
      setStep('details')
      addToast('error', err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally { setProcessing(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-light flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center shadow-glow">
          <NairaCoinIcon className="h-7 w-7 text-white" />
        </div>
        <div className="h-1 w-24 bg-light-border rounded-full overflow-hidden">
          <motion.div className="h-full bg-accent rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeInOut' }} />
        </div>
      </motion.div>
    </div>
  )

  if (error && !recipient) return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <div className="bg-white rounded-3xl p-8 shadow-neo border border-light-border">
          <div className="w-16 h-16 rounded-full bg-error-dim flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">Broken link</span>
          </div>
          <h2 className="text-lg font-bold text-dark-text mb-2">Link not found</h2>
          <p className="text-sm text-text-muted mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="h-11 px-6 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-all">
            Go to tipfy
          </button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-light pattern-coins">
      {/* Nav */}
      <div className="border-b border-light-border bg-white/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center"><NairaCoinIcon className="h-4 w-4 text-white" /></div>
            <span className="text-base font-bold text-dark-text tracking-tight">tipfy</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-medium">Secure</span>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-5 py-8 pb-28">
        <AnimatePresence mode="wait">
          {/* ===== PROCESSING ===== */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-14 w-14 rounded-full border-[3px] border-border border-t-accent mx-auto mb-6" />
              <h2 className="text-lg font-bold text-dark-text">Sending your tip...</h2>
              <p className="text-sm text-text-muted mt-2">Setting up secure payment</p>
            </motion.div>
          )}

          {/* ===== SUCCESS ===== */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }} className="w-24 h-24 rounded-full bg-success-dim flex items-center justify-center mx-auto mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}>
                  <Heart className="h-12 w-12 text-success fill-success" />
                </motion.div>
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-bold text-dark-text">Tip sent!</motion.h2>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="text-text-muted mt-3 text-sm">
                {recipient?.displayName} will be notified of your generosity.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-dim text-accent text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                {formatNaira(selectedAmount)} sent with love
              </motion.div>
            </motion.div>
          )}

          {/* ===== AMOUNT / DETAILS ===== */}
          {(step === 'amount' || step === 'details') && (
            <motion.div key="main" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Profile */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-accent to-purple-500 opacity-20 blur-sm" />
                  <div className="relative h-24 w-24 rounded-full bg-accent/10 border-4 border-white shadow-neo flex items-center justify-center text-accent text-2xl font-bold">
                    {recipient?.displayName?.charAt(0) || username?.charAt(0) || '?'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-success border-[3px] border-white flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 5" /></svg>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-dark-text mt-4">{recipient?.displayName}</h1>
                <p className="text-text-muted text-sm mt-0.5">@{recipient?.username}</p>
                {recipient?.bio && <p className="text-text-secondary text-sm mt-3 max-w-xs mx-auto leading-relaxed">{recipient.bio}</p>}
                {recipient?.totalTipsReceived > 0 && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                    <span className="text-xs">🔥</span>
                    <span className="text-xs font-semibold text-orange-600">{recipient.totalTipsReceived}+ people have tipped</span>
                  </div>
                )}
              </motion.div>

              <AnimatePresence mode="wait">
                {/* ===== STEP: Amount ===== */}
                {step === 'amount' && (
                  <motion.div key="amount" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                    <div className="text-center mb-6">
                      <h2 className="text-lg font-bold text-dark-text">Send a tip</h2>
                      <p className="text-sm text-text-muted mt-1">Show appreciation with a token of gratitude</p>
                    </div>

                    {/* Amount grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {PRESET_AMOUNTS.map((a, i) => (
                        <motion.button key={a} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }} whileTap={{ scale: 0.95 }}
                          onClick={() => { setAmount(a); setCustomAmount('') }}
                          className={`relative py-4 rounded-2xl font-bold text-base transition-all duration-200 ${amount === a
                            ? 'bg-accent text-white shadow-glow scale-[1.02]'
                            : 'bg-white text-dark-text border-2 border-light-border hover:border-accent/30 hover:shadow-neo-sm'
                          }`}>
                          {amount === a && (
                            <motion.div layoutId="amount-selected" className="absolute inset-0 rounded-2xl bg-accent" style={{ zIndex: -1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                          )}
                          <span className={amount === a ? 'text-white' : ''}>₦{a.toLocaleString()}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Custom amount */}
                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-lg">₦</span>
                      <input type="number" placeholder="Other amount" value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setAmount(null) }}
                        className="w-full h-14 pl-10 pr-4 text-lg font-bold bg-white border-2 border-light-border rounded-2xl text-dark-text placeholder:text-text-muted/60 placeholder:font-normal placeholder:text-base focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent-dim transition-all font-mono-nums" />
                    </div>

                    {/* CTA */}
                    <motion.button whileTap={{ scale: 0.97 }} disabled={!selectedAmount || selectedAmount <= 0}
                      onClick={() => { setError(''); setStep('details') }}
                      className="w-full h-14 bg-accent text-white rounded-2xl text-base font-bold hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-glow flex items-center justify-center gap-2">
                      Continue {selectedAmount > 0 && `with ${formatNaira(selectedAmount)}`}
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>

                    {/* Trust */}
                    <div className="flex items-center justify-center gap-4 mt-6 text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        <span>256-bit encrypted</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span>Instant delivery</span>
                    </div>
                  </motion.div>
                )}

                {/* ===== STEP: Details ===== */}
                {step === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-center justify-between mb-6">
                      <button type="button" onClick={() => setStep('amount')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-dark-text transition-colors font-medium">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <div className="px-3 py-1.5 rounded-full bg-accent-dim text-accent text-sm font-bold">
                        {formatNaira(selectedAmount)}
                      </div>
                    </div>

                      <div className="text-center mb-6">
                        <h2 className="text-lg font-bold text-dark-text">Almost there!</h2>
                        <p className="text-sm text-text-muted mt-1">Add a personal touch to your tip</p>
                      </div>

                      <TipFeeBreakdown quote={quote} loading={quoteLoading} />

                    <form onSubmit={handleTip} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2">Your name</label>
                        <div className="relative">
                          <Send className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                          <input placeholder="Anonymous" value={senderName} onChange={(e) => setSenderName(e.target.value)}
                            className="w-full h-12 pl-11 pr-4 text-sm bg-white border-2 border-light-border rounded-2xl text-dark-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent-dim transition-all" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2">Email <span className="font-normal">(for receipt)</span></label>
                        <input type="email" placeholder="you@example.com" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} required
                          className="w-full h-12 px-4 text-sm bg-white border-2 border-light-border rounded-2xl text-dark-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent-dim transition-all" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2">Leave a message</label>
                        <div className="relative">
                          <MessageCircle className="absolute left-4 top-4 h-4 w-4 text-text-muted" />
                          <textarea placeholder="Thanks for your work!" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} rows={3}
                            className="w-full pl-11 pr-4 pt-3 pb-3 text-sm bg-white border-2 border-light-border rounded-2xl text-dark-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent-dim transition-all resize-none" />
                          <span className="absolute bottom-3 right-4 text-[10px] text-text-muted font-medium">{message.length}/200</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2">What is this for?</label>
                        <div className="grid grid-cols-5 gap-2">
                          {TIP_CATEGORIES.map((c) => (
                            <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                              className={`py-2.5 rounded-xl text-[11px] font-semibold text-center transition-all border-2 ${
                                category === c.value
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-white text-gray-500 border-light-border hover:border-accent/30'
                              }`}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={processing}
                        className="w-full h-14 bg-accent text-white rounded-2xl text-base font-bold hover:bg-accent-hover disabled:opacity-50 transition-all shadow-glow flex items-center justify-center gap-2.5">
                        {processing ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5" />
                            Pay {formatNaira(selectedAmount)}
                          </>
                        )}
                      </motion.button>

                      <div className="flex items-center justify-center gap-2 pt-2 pb-4">
                        <Heart className="h-3.5 w-3.5 text-text-muted" />
                        <p className="text-[11px] text-text-muted">Your generosity makes a difference</p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 py-3 bg-light/80 backdrop-blur-sm border-t border-light-border z-10">
        <div className="flex items-center justify-center gap-1.5">
          <NairaCoinIcon className="h-3 w-3 text-accent" />
          <span className="text-[11px] font-medium text-text-muted">Powered by tipfy</span>
        </div>
      </div>
    </div>
  )
}

function TipFeeBreakdown({ quote, loading }: { quote: any; loading: boolean }) {
  if (loading && !quote) {
    return (
      <div className="bg-light rounded-2xl border border-light-border p-4 space-y-2.5 text-sm">
        <div className="h-3.5 w-1/2 bg-border/50 rounded animate-pulse" />
        <div className="h-3.5 w-2/3 bg-border/50 rounded animate-pulse" />
        <div className="h-3.5 w-3/5 bg-border/50 rounded animate-pulse" />
      </div>
    )
  }
  if (!quote) return null
  const { amount, processingFee, totalCharge, platformFee, netToRecipient } = quote
  return (
    <div className="bg-light rounded-2xl border border-light-border p-4 space-y-2.5 text-sm">
      <div className="flex justify-between text-text-secondary">
        <span>Tip amount</span>
        <span className="font-semibold text-dark-text">{formatNaira(amount)}</span>
      </div>
      <div className="flex justify-between text-text-secondary">
        <span>Processing fee</span>
        <span className="font-semibold text-dark-text">{formatNaira(processingFee)}</span>
      </div>
      <div className="flex justify-between text-text-secondary">
        <span>Platform fee</span>
        <span className="font-semibold text-dark-text">−{formatNaira(platformFee)}</span>
      </div>
      <div className="flex justify-between text-text-secondary">
        <span>Receiver gets</span>
        <span className="font-bold text-success">{formatNaira(netToRecipient)}</span>
      </div>
      <div className="h-px bg-light-border" />
      <div className="flex justify-between items-center">
        <span className="font-semibold text-dark-text">You pay</span>
        <span className="text-base font-bold text-accent">{formatNaira(totalCharge)}</span>
      </div>
    </div>
  )
}
