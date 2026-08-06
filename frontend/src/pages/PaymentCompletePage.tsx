import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Star, ArrowLeft, Heart, XCircle } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { api, ApiError } from '~/lib/api'
import { useUIStore } from '~/lib/store'
import { formatNaira } from '~/lib/utils'
import { Button } from '~/components/ui/Button'
import { Textarea } from '~/components/ui/Textarea'

export default function PaymentCompletePage() {
  const [searchParams] = useSearchParams()
  const rawRef = searchParams.get('ref') || ''
  const ref = rawRef.split('?')[0].split('&')[0]
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'failed' | 'pending' | null>(null)
  const [tip, setTip] = useState<any>(null)
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    if (!ref) return
    let cancelled = false
    api<{ status: 'completed' | 'failed' | 'pending'; tip?: any }>(`/tips/${ref}/verify`)
      .then((res) => {
        if (cancelled) return
        setPaymentStatus(res?.status || 'pending')
        setTip(res?.tip || null)
      })
      .catch(() => {
        if (!cancelled) setPaymentStatus('pending')
      })
    return () => { cancelled = true }
  }, [ref])

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || !ref) return
    setSubmitting(true)
    try {
      await api(`/tips/${ref}/feedback`, { method: 'POST', body: { rating, comment: comment || undefined } })
      setSubmitted(true)
      addToast('success', 'Thanks for your feedback!')
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.message : 'Could not submit feedback')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-light">
      <nav className="border-b border-gray-200 bg-white/60 backdrop-blur-md">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center"><NairaCoinIcon className="h-3.5 w-3.5 text-white" /></div>
            <span className="font-bold text-dark-text">tipfy</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center mb-8">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6 ${paymentStatus === 'failed' ? 'bg-error/10' : 'bg-success/10'}`}>
              {paymentStatus === 'failed'
                ? <XCircle className="h-8 w-8 text-error" />
                : <CheckCircle className="h-8 w-8 text-success" />}
            </div>
            <h1 className="text-2xl font-bold text-dark-text mb-2">
              {paymentStatus === 'failed' ? 'Payment failed' : 'Thank you!'}
            </h1>
            <p className="text-gray-500 text-sm">
              {paymentStatus === 'failed'
                ? 'We could not confirm your payment. Please try again.'
                : 'Your tip has been processed successfully.'}
            </p>
            {ref && <p className="text-gray-400 text-xs mt-2 font-mono">Ref: {ref}</p>}
          </div>

          {paymentStatus === 'failed' ? (
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-200/60 text-center py-8">
              <p className="text-sm font-medium text-gray-600">
                If you believe this is an error, please contact support.
              </p>
              <div className="mt-6">
                <Link to="/" className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-accent">
                  <ArrowLeft className="h-4 w-4" /> Back to tipfy
                </Link>
              </div>
            </div>
          ) : paymentStatus === 'completed' && tip ? (
            <>
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-200/60 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-dark-text">Receipt</span>
                  {tip.recipientName && <span className="text-xs text-gray-400">to {tip.recipientName}</span>}
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Tip amount</span>
                    <span className="font-semibold text-dark-text">{formatNaira(tip.amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Processing fee</span>
                    <span className="font-semibold text-dark-text">{formatNaira(tip.processingFee)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Platform fee</span>
                    <span className="font-semibold text-dark-text">−{formatNaira(tip.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{tip.recipientName || 'Recipient'} gets</span>
                    <span className="font-bold text-success">{formatNaira(tip.netAmount)}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-dark-text">Total charged</span>
                    <span className="text-lg font-bold text-accent">{formatNaira(tip.totalCharged)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-200/60">
              <form onSubmit={handleFeedback} className="space-y-5">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-4">How was your experience?</p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95">
                        <Star
                          className={`h-10 w-10 transition-colors ${
                            star <= (hoveredStar || rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                <div>
                  <Textarea
                    label="Leave a comment (optional)"
                    placeholder="Tell others about your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    showCounter
                  />
                </div>

                <Button type="submit" fullWidth loading={submitting} disabled={!rating || submitting}>
                  Submit Feedback
                </Button>

                <button type="button" onClick={() => setSubmitted(true)}
                  className="w-full text-center text-sm text-gray-400 hover:text-dark-text transition-colors">
                  Skip for now
                </button>
              </form>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-200/60 text-center py-8">
              <Heart className="h-8 w-8 text-accent mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">
                {rating > 0 ? 'Thanks for your feedback!' : 'Thanks! You can always rate later.'}
              </p>
            </div>
          )}

          <div className="text-center mt-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-dark-text transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to tipfy
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
