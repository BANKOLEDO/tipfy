import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import PhoneMockup from './PhoneMockup'

export default function HeroSection() {
  return (
    <section className="relative pt-14 sm:pt-16 bg-light overflow-hidden">
      {/* Massive repeating watermark */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute left-0 w-full" style={{ top: `${15 + i * 30}%` }}>
            <span
              className="text-[10vw] sm:text-[12vw] lg:text-[11vw] font-black leading-none tracking-tighter text-transparent block text-center"
              style={{ WebkitTextStroke: `2px rgba(37,99,235,${0.12 - i * 0.03})` }}
            >
              TIPFY IS HERE
            </span>
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-4 sm:py-8 lg:py-14">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-2 sm:mb-6 lg:mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] sm:text-xs font-medium"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Now live in Nigeria
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] sm:text-xs text-gray-400 hidden sm:block"
          >
            50,000+ creators on tipfy
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-20">
          {/* Left column — headlines + CTA */}
          <div className="flex-1">
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-[10vw] sm:text-[8vw] lg:text-[6vw] font-black tracking-[-0.03em] leading-[0.85] text-dark-text -ml-1"
              >
                GET PAID
              </motion.h1>
            </div>
            <div className="overflow-hidden mt-2 sm:mt-3">
              <motion.h1
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-[10vw] sm:text-[8vw] lg:text-[6vw] font-black tracking-[-0.03em] leading-[0.85] text-accent"
              >
                FOR YOUR CRAFT
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm mt-4 sm:mt-6 mb-4 sm:mb-6"
            >
              A personal link to receive tips — for your craft, your service, your content. Share it. Get paid. Repeat.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link to="/register" className="group bg-accent text-white px-5 py-3 rounded-xl font-medium hover:bg-accent-hover transition-all active:scale-[0.97] flex items-center gap-2 text-sm">
                Start receiving tips
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#flow" className="px-5 py-3 rounded-xl font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-dark-text transition-all text-sm">
                See how it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex items-center gap-3 mt-4 sm:mt-6"
            >
              <div className="flex -space-x-2">
                {['CO', 'EA', 'FB', 'AO', 'KI'].map((initials, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.05 + i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
                    className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-light bg-bg-elevated flex items-center justify-center text-[8px] sm:text-[9px] font-medium text-text-secondary"
                  >
                    {initials}
                  </motion.div>
                ))}
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-400">50,000+ already on tipfy</p>
            </motion.div>
          </div>

          {/* Right column — phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 80, damping: 18 }}
            className="hidden lg:flex justify-end shrink-0 mt-0"
          >
            <div>
              <PhoneMockup />
            </div>
          </motion.div>
        </div>

        {/* Phone — mobile, below content */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 80, damping: 18 }}
          className="lg:hidden flex justify-center mt-10 sm:mt-14"
        >
          <div className="scale-[0.7] sm:scale-[0.85]">
            <PhoneMockup />
          </div>
        </motion.div>
      </div>
    </section>
  )
}