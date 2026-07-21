import { motion } from 'framer-motion'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const features = [
  { span: 'col-span-2 lg:col-span-1 row-span-1', title: 'Instant payouts', desc: 'Money in your bank in under 30 seconds. Not tomorrow. Now.', icon: (
    <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10" fill="none"><rect x="4" y="8" width="14" height="24" rx="4" fill="#2563EB" opacity="0.1"/><path d="M11 16v8M8 20h6" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 20h8" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/><circle cx="32" cy="20" r="5" fill="#00B894" opacity="0.15"/><path d="M30 20l1.5 1.5L34 19" stroke="#00B894" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ), tag: 'Speed' },
  { span: 'col-span-1', title: 'Team splits', desc: 'Auto-divide tips. Everyone sees who got what.', icon: (
    <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10" fill="none"><circle cx="20" cy="10" r="6" fill="#2563EB" opacity="0.12"/><path d="M20 16v4M14 26l6-6 6 6" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="30" r="4" fill="#D1D5DB" opacity="0.5"/><circle cx="20" cy="30" r="4" fill="#D1D5DB" opacity="0.5"/><circle cx="28" cy="30" r="4" fill="#D1D5DB" opacity="0.5"/></svg>
  ), tag: 'Teams' },
  { span: 'col-span-1', title: 'Cards, transfer, USSD', desc: 'Your tipper chooses how to pay.', icon: (
    <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10" fill="none"><rect x="4" y="8" width="14" height="10" rx="3" fill="#2563EB" opacity="0.1"/><rect x="22" y="8" width="14" height="10" rx="3" fill="#D1D5DB" opacity="0.5"/><rect x="4" y="22" width="14" height="10" rx="3" fill="#D1D5DB" opacity="0.5"/><rect x="22" y="22" width="14" height="10" rx="3" fill="#2563EB" opacity="0.1"/></svg>
  ), tag: 'Payments' },
  { span: 'col-span-2 lg:col-span-1 row-span-1', title: 'See where tips come from', desc: 'Track every naira. Know what works.', icon: (
    <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10" fill="none"><polyline points="4,32 12,26 20,28 28,16 36,10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="36" cy="10" r="2.5" fill="#2563EB"/></svg>
  ), tag: 'Analytics' },
  { span: 'col-span-1', title: 'Bank-grade security', desc: 'Encrypted end to end.', icon: (
    <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10" fill="none"><rect x="10" y="18" width="20" height="16" rx="3" fill="#D1D5DB" opacity="0.5"/><path d="M14 18v-4a6 6 0 0112 0v4" stroke="#D1D5DB" strokeWidth="1.5" fill="none"/><circle cx="20" cy="26" r="2.5" fill="#00B894" opacity="0.2"/><path d="M18.5 26l1 1 2.5-2.5" stroke="#00B894" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ), tag: 'Security' },
  { span: 'col-span-1', title: 'Your own QR code', desc: 'Print it, share it, stick it on your shop.', icon: (
    <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-10 sm:h-10" fill="none"><rect x="8" y="8" width="10" height="10" rx="1" fill="#1A1A2E"/><rect x="10" y="10" width="6" height="6" rx="0.5" fill="white"/><rect x="22" y="8" width="10" height="10" rx="1" fill="#1A1A2E"/><rect x="24" y="10" width="6" height="6" rx="0.5" fill="white"/><rect x="8" y="22" width="10" height="10" rx="1" fill="#1A1A2E"/><rect x="10" y="24" width="6" height="6" rx="0.5" fill="white"/><rect x="22" y="22" width="4" height="4" fill="#2563EB"/><rect x="28" y="22" width="4" height="4" fill="#1A1A2E"/><rect x="22" y="28" width="4" height="4" fill="#1A1A2E"/><rect x="28" y="28" width="4" height="4" fill="#1A1A2E"/></svg>
  ), tag: 'Tools' },
]

export default function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-light pattern-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="mb-10 sm:mb-14 max-w-2xl">
          <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-4">Features</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-text tracking-tight leading-[1.1]">
            Built for how you actually work.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base mt-4 leading-relaxed max-w-lg">
            Everything you need to accept, split, and track tips — without the complexity.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`${f.span} group bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50 group-hover:bg-accent/5 transition-colors duration-300">{f.icon}</div>
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wider">{f.tag}</span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-dark-text leading-snug">{f.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
