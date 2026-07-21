import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const values = [
  { title: 'People first', desc: 'We build for real people doing real work. Every feature starts with: does this make someone\'s life easier?' },
  { title: 'Radical simplicity', desc: 'If it takes more than 3 clicks, we rebuild it. Complexity is a bug, not a feature.' },
  { title: 'Nigeria-first', desc: 'Built for Nigerian banks, Nigerian payment methods, and Nigerian realities. We don\'t pretend Lagos is San Francisco.' },
]

const milestones = [
  { year: '2026', event: 'tipfy founded in Lagos' },
  { year: '2026', event: 'Launched with 50 beta users in one barbershop' },
  { year: '2026', event: 'Reached 1,000 active users across Lagos and Abuja' },
  { year: '2026', event: 'Launched team splitting feature' },
  { year: '2026', event: 'Expanded to business accounts and 10,000+ users' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-light text-dark-text pattern-mixed">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-start mb-16 sm:mb-24">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">About tipfy</motion.p>
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">We believe workers deserve to be tipped fairly</motion.h1>
              <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base leading-relaxed mb-4">
                tipfy was born from a simple observation: tipping in Nigeria is broken. Cash is disappearing, but the desire to show appreciation hasn't.
              </motion.p>
              <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base leading-relaxed">
                Whether you're a barber in Surulere, a chef in Victoria Island, or a hotel staff in Ikoyi — you deserve a simple way to receive what you've earned.
              </motion.p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
              <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=700&q=80&auto=format&fit=crop" alt="Team working" className="h-full w-full object-cover" loading="lazy" />
            </motion.div>
          </div>

          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold mb-6">Our mission</motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
            className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl mb-12 sm:mb-16">
            To make tipping seamless, instant, and transparent for every worker in Nigeria. We want to build the infrastructure that lets anyone who does good work earn more from the people who appreciate it.
          </motion.p>

          <div className="grid sm:grid-cols-3 gap-4 mb-12 sm:mb-16">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-gray-100 rounded-xl p-5">
                <h3 className="font-bold text-sm mb-2">{v.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold mb-6">Our journey</motion.h2>
          <div className="max-w-xl">
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
              {milestones.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-accent/20 border-2 border-accent" />
                  <p className="text-[10px] text-gray-400 font-medium mb-0.5">{m.year}</p>
                  <p className="text-sm text-gray-600">{m.event}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-14 sm:mt-20 bg-dark-text rounded-2xl p-8 text-center text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Join us</h2>
            <p className="text-gray-400 text-sm mb-5">We're building the future of tipping in Nigeria.</p>
            <Link to="/register" className="bg-accent text-white px-5 py-3 rounded-xl font-medium hover:bg-accent-hover transition-all active:scale-[0.97] inline-flex items-center gap-2 text-sm">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
