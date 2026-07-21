import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const cases = [
  {
    img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format&fit=crop',
    title: 'Salons & barbershops',
    desc: 'Clients scan the QR on your mirror. Tip received before the haircut is done.',
    tag: 'In-Store',
    howItWorks: [
      'Place your tipfy QR code on mirrors, counters, or waiting areas.',
      'Clients scan with any phone camera — no app needed.',
      'Choose an amount, tap pay, done. Money lands in seconds.',
    ],
    benefits: ['No card reader needed', 'Staff splits automatically', 'Works offline for tips'],
  },
  {
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop',
    title: 'Restaurants & cafes',
    desc: 'Put your tipfy code on the receipt, the table, or the wall. Staff split it automatically.',
    tag: 'Hospitality',
    howItWorks: [
      'Add your tipfy QR to receipts, table tents, or wall posters.',
      'Diners scan before or after their meal — zero friction.',
      'Tips are split across team members based on rules you set.',
    ],
    benefits: ['POS integration available', 'Real-time payout tracking', 'Custom split rules per shift'],
  },
  {
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80&auto=format&fit=crop',
    title: 'Content creators',
    desc: 'Drop your link in your bio, your description, your pinned comment. Fans tip directly.',
    tag: 'Digital',
    howItWorks: [
      'Copy your unique tipfy link and paste it anywhere online.',
      'Fans click, choose an amount, and pay — card, transfer, or USSD.',
      'You get notified instantly. Payout hits your bank in under 30 seconds.',
    ],
    benefits: ['Works on any platform', 'No follower minimum', 'Accepts naira cards & transfers'],
  },
  {
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&auto=format&fit=crop',
    title: 'Freelancers',
    desc: 'Attach your tip link to every deliverable. Clients who are happy show it with money.',
    tag: 'Services',
    howItWorks: [
      'Include your tipfy link in invoices, proposals, or project handoffs.',
      'Clients click to tip on top of your agreed rate — no awkward conversation.',
      'Track which clients tip most and build loyalty over time.',
    ],
    benefits: ['Boosts client relationships', 'Add to any invoice tool', 'No platform fees on tips'],
  },
  {
    img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80&auto=format&fit=crop',
    title: 'Events & concerts',
    desc: 'Project your QR on screen. The whole crowd can tip the artist in real time.',
    tag: 'Live Events',
    howItWorks: [
      'Display your tipfy QR on projectors, screens, or event merch.',
      'Audience scans during the show — tips stream in live.',
      'Artists and organizers see real-time totals on a live dashboard.',
    ],
    benefits: ['Live tipping counter', 'Works for large crowds', 'Instant artist payout'],
  },
  {
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
    title: 'Logistics & delivery',
    desc: 'Riders, drivers, dispatchers. A quick scan after delivery says "thank you" with naira.',
    tag: 'Delivery',
    howItWorks: [
      'Share your tipfy QR or link after every successful delivery.',
      'Customers scan and tip in two taps — no cash, no change needed.',
      'Earnings accumulate and payout daily to your registered bank.',
    ],
    benefits: ['No cash handling', 'Daily auto-payouts', 'QR cards for riders'],
  },
]

export default function UseCasesSection() {
  const [active, setActive] = useState<number | null>(null)
  const item = active !== null ? cases[active] : null

  return (
    <section className="py-20 sm:py-28 bg-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="mb-14 sm:mb-20 max-w-2xl">
          <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-4">Use cases</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            Built for real work.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text-secondary text-sm sm:text-base mt-4 leading-relaxed max-w-lg">
            From barbershops to concert halls — anywhere money changes hands, tipfy makes it instant.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setActive(i)}
            >
              <div className="relative overflow-hidden aspect-[16/11]">
                <img src={c.img} alt={c.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-500" />
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider bg-white/10 backdrop-blur-md text-white/80 rounded-full border border-white/10">{c.tag}</span>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-6">
                  <h3 className="font-bold text-base sm:text-lg text-white leading-snug">{c.title}</h3>
                  <p className="text-xs sm:text-sm text-white/60 mt-1.5 leading-relaxed line-clamp-2 group-hover:text-white/80 transition-colors duration-300">{c.desc}</p>
                  <div className="flex items-center gap-1.5 mt-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="text-accent text-xs font-medium">Learn more</span>
                    <svg className="w-3.5 h-3.5 text-accent transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active !== null && item && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-bg-surface border border-border rounded-2xl shadow-neo-lg scrollbar-thin"
            >
              <div className="relative aspect-[16/9] overflow-hidden sticky top-0 z-10">
                <img src={item.img} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/20 to-transparent" />
                <button onClick={() => setActive(null)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/60 transition-colors z-20">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider bg-white/10 backdrop-blur-md text-white/80 rounded-full border border-white/10">{item.tag}</span>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="font-bold text-lg sm:text-xl text-text">{item.title}</h3>
                <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{item.desc}</p>

                <div className="mt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">How it works</h4>
                  <ol className="space-y-3">
                    {item.howItWorks.map((step, si) => (
                      <li key={si} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                        <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">{si + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {item.benefits.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg rounded-lg border border-border">
                      <svg className="w-3 h-3 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {b}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-7 pt-5 border-t border-border">
                  <button onClick={() => setActive(null)} className="px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-text bg-bg rounded-lg border border-border hover:border-border-hover transition-colors">Close</button>
                  <button className="px-5 py-2.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors">Get started</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
