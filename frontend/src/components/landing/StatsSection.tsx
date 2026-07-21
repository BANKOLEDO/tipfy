import { motion } from 'framer-motion'

export default function StatsSection() {
  return (
    <section className="py-16 sm:py-24 bg-light pattern-mixed">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            { value: '₦2B+', label: 'Processed', sub: 'and counting' },
            { value: '50K+', label: 'Creators', sub: 'across Nigeria' },
            { value: '< 30s', label: 'Payout speed', sub: 'average' },
            { value: '99.9%', label: 'Uptime', sub: 'always on' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`${i > 0 ? 'lg:border-l lg:border-gray-200 lg:pl-6 lg:pl-8' : ''}`}>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-text tracking-tight font-mono-nums">{s.value}</p>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1.5 sm:mt-2">{s.label}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}