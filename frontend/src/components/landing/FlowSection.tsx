import { motion } from 'framer-motion'
import FlowAnimation from './FlowAnimation'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function FlowSection() {
  return (
    <section id="flow" className="py-16 sm:py-24 bg-light pattern-coins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-8 sm:mb-12">
          <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2 sm:mb-3">The flow</motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-text">From thank you to paid.</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 mt-2 sm:mt-3 max-w-md text-sm sm:text-base">
            Someone appreciates your work. They scan, tap, pay. You get the money. The whole thing takes less time than making eye contact.
          </motion.p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <FlowAnimation />
        </motion.div>
      </div>
    </section>
  )
}