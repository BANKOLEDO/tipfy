import { motion } from 'framer-motion'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-24 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-10 sm:mb-14">
          <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2 sm:mb-3">From the community</motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold">Real people. Real tips.</motion.h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { name: 'Chioma O.', role: 'Hair Stylist, Lagos', quote: 'My clients just scan and tip. No more awkward "send me account number" moments. I get paid before they even leave the chair.', img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80&auto=format&fit=crop' },
            { name: 'Emeka A.', role: 'Content Creator', quote: 'I dropped my tipfy link in my bio and pinned it in my comments. That week alone I made more from tips than two brand deals combined.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop' },
            { name: 'Fatima B.', role: 'Restaurant Owner, Abuja', quote: 'Staff tips used to disappear. Now it splits automatically. Fair, transparent, done.', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&auto=format&fit=crop' },
          ].map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group">
              <div className="rounded-xl sm:rounded-2xl overflow-hidden aspect-[3/2] sm:aspect-[4/3] mb-3 sm:mb-4 bg-bg-surface">
                <img src={s.img} alt={s.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">"{s.quote}"</p>
              <div className="mt-2 sm:mt-3 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium">{s.name}</p>
                  <p className="text-[10px] sm:text-xs text-text-muted">{s.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}