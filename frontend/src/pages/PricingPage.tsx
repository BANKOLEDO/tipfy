import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const plans = [
  {
    name: 'Starter', price: 'Free', period: '',
    features: [
      { text: 'Personal tip page', included: true }, { text: 'Unique QR code', included: true },
      { text: 'Basic analytics', included: true }, { text: 'Bank withdrawals', included: true },
      { text: 'Custom branding', included: false }, { text: 'Team splits', included: false }, { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro', price: '₦2,500', period: '/month', badge: 'Most popular',
    features: [
      { text: 'Everything in Starter', included: true }, { text: 'Custom branding', included: true },
      { text: 'Advanced analytics', included: true }, { text: 'Team splits (up to 5)', included: true },
      { text: 'Priority support', included: true }, { text: 'Custom tip amounts', included: true }, { text: 'API access', included: false },
    ],
  },
  {
    name: 'Business', price: '₦7,500', period: '/month',
    features: [
      { text: 'Everything in Pro', included: true }, { text: 'Unlimited team members', included: true },
      { text: 'Percentage-based splits', included: true }, { text: 'Full API access', included: true },
      { text: 'Dedicated support', included: true }, { text: 'Multi-location', included: true }, { text: 'Financial reports', included: true },
    ],
  },
]

const faqs = [
  { q: 'What\'s the catch with the free plan?', a: 'There isn\'t one. The Starter plan is free forever. The only fee is a 2.5% processing charge on each tip.' },
  { q: 'Can I switch plans anytime?', a: 'Yes. Upgrade instantly. Downgrade at the end of your billing cycle. No lock-in, no cancellation fees.' },
  { q: 'How fast are withdrawals?', a: 'Our average withdrawal time is 22 seconds. We connect directly to Nigerian bank APIs.' },
  { q: 'Do you support team accounts?', a: 'Yes. Pro supports up to 5 members. Business supports unlimited members with advanced splits.' },
  { q: 'Is my money safe?', a: 'Yes. We use bank-level encryption and are PCI DSS compliant. All transactions are processed through licensed Nigerian payment processors.' },
  { q: 'Can I customise my tip page?', a: 'Absolutely. Pro and Business plans let you add your own branding, colours, profile photo, bio, and custom tip amounts.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major debit and credit cards, bank transfers, and USSD payments through our secure payment partners.' },
  { q: 'How do I get started?', a: 'Sign up for free, customise your profile, share your unique link or QR code, and start receiving tips in minutes.' },
  { q: 'Are there any hidden fees?', a: 'None. The only charge is the 2.5% processing fee on each tip. No monthly fees on Starter, and no surprise charges on any plan.' },
  { q: 'Do you offer refunds?', a: 'Tip recipients receive funds directly, so refunds are handled between you and your tipper. We can assist with disputed transactions on a case-by-case basis.' },
]

function FaqItem({ faq, index, open, onToggle }: { faq: { q: string; a: string }; index: number; open: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="group"
    >
      <button
        onClick={onToggle}
        className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 ${
          open
            ? 'bg-accent/5 ring-1 ring-accent/20'
            : 'bg-white hover:bg-gray-50/80 ring-1 ring-gray-100 hover:ring-gray-200'
        }`}
      >
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
            open
              ? 'bg-accent text-white rotate-0'
              : 'bg-gray-100 text-gray-400 group-hover:bg-accent/10 group-hover:text-accent'
          }`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm transition-colors duration-200 ${open ? 'text-accent' : 'text-dark-text'}`}>
            {faq.q}
          </h3>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="text-sm text-gray-500 leading-relaxed pt-2">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </motion.div>
  )
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-light text-dark-text pattern-grid">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">Pricing</motion.p>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-3">Simple, transparent pricing</motion.h1>
            <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base max-w-xl mb-4">Start free. Upgrade when you need more. No surprises.</motion.p>
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-10 sm:mb-14">
              <div className="flex items-center gap-1.5 text-sm text-gray-500"><Check className="h-4 w-4 text-success" /> No credit card</div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500"><Check className="h-4 w-4 text-success" /> Cancel anytime</div>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-16 sm:mb-24">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 ${plan.badge ? 'bg-accent text-white ring-2 ring-accent' : 'bg-white border border-gray-100'}`}>
                {plan.badge && <div className="absolute -top-3 left-6 bg-dark-text text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">{plan.badge}</div>}
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${plan.badge ? 'text-white/70' : 'text-gray-400'}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.badge ? 'text-white/60' : 'text-gray-400'}`}>{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2 text-sm">
                      {f.included ? <Check className={`h-4 w-4 shrink-0 ${plan.badge ? 'text-white' : 'text-accent'}`} /> : <X className="h-4 w-4 shrink-0 text-gray-200" />}
                      <span className={plan.badge ? (f.included ? 'text-white/90' : 'text-white/40') : (f.included ? 'text-gray-600' : 'text-gray-300')}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block text-center py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.97] ${plan.badge ? 'bg-white text-accent hover:bg-white/90' : 'bg-dark-text text-white hover:bg-dark-text/90'}`}>Get started</Link>
              </motion.div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl sm:text-2xl font-bold mb-6">Frequently asked questions</motion.h2>
          </div>
          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-14 sm:mt-20 text-center">
            <Link to="/register" className="bg-accent text-white px-6 py-3.5 rounded-xl font-medium hover:bg-accent-hover transition-all active:scale-[0.97] inline-flex items-center gap-2 text-sm">
              Create your free profile <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
