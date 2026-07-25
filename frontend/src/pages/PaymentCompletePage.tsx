import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Star, ArrowLeft, Heart } from 'lucide-react'
import NairaCoinIcon from '~/components/NairaCoinIcon'
import { api, ApiError } from '~/lib/api'
import { useUIStore } from '~/lib/store'
import { Card, CardContent } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'
import { Textarea } from '~/components/ui/Textarea'

export default function PaymentCompletePage() {
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

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
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center"><NairaCoinIcon className="h-3.5 w-3.5 text-white" /></div>
            <span className="font-bold">tipfy</span>
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Thank you!</h1>
            <p className="text-text-secondary">Your tip has been processed successfully.</p>
            {ref && <p className="text-text-muted text-xs mt-2 font-mono">Ref: {ref}</p>}
          </div>

          {/* Rating Card */}
          {!submitted ? (
            <Card>
              <CardContent>
                <form onSubmit={handleFeedback} className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-secondary mb-4">How was your experience?</p>
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
                      <p className="text-xs text-text-muted mt-2">
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
                    className="w-full text-center text-sm text-text-muted hover:text-text transition-colors">
                    Skip for now
                  </button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-6">
                <Heart className="h-8 w-8 text-accent mx-auto mb-3" />
                <p className="text-sm font-medium text-text-secondary">
                  {rating > 0 ? 'Thanks for your feedback!' : 'Thanks! You can always rate later.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to tipfy
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
