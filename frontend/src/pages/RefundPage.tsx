import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const sections = [
  { title: 'Overview', content: 'We want you to be satisfied with our services. This refund policy explains how we handle refund requests.' },
  { title: 'Tip Refunds', content: 'Tips are generally non-refundable once delivered. However, if a tip was made in error or due to unauthorized activity, you may request a refund within 24 hours of the transaction.' },
  { title: 'Subscription Refunds', content: 'You may request a full refund within 7 days of your initial subscription purchase. After 7 days, subscriptions are non-refundable but you can cancel anytime to prevent future charges.' },
  { title: 'How to Request', content: 'Contact us at support@tipfy.com with your transaction ID and reason for the refund request. We will review within 3 business days.' },
  { title: 'Processing', content: 'Approved refunds are processed within 5-10 business days to your original payment method or bank account. You will receive an email confirmation.' },
  { title: 'Disputes', content: 'If you disagree with our refund decision, email disputes@tipfy.com. Our team will review and respond within 7 business days.' },
  { title: 'Contact', content: 'For questions about this policy, contact us at support@tipfy.com.' },
]

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-light text-dark-text pattern-naira">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Refund Policy</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: July 21, 2026</p>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            We want you to have a great experience with tipfy. Here's how we handle refund requests.
          </p>

          <div className="space-y-7">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-bold text-sm sm:text-base mb-1.5">{s.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
