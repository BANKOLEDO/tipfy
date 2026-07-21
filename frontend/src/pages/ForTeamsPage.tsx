import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Users, PieChart, Shield } from 'lucide-react'
import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const splitModels = [
  { icon: <Users className="h-5 w-5" />, title: 'Equal split', desc: 'Everyone gets the same share. Best for small teams where roles are similar.' },
  { icon: <PieChart className="h-5 w-5" />, title: 'Percentage-based', desc: 'Different roles, different percentages. 60% front-of-house, 30% kitchen, 10% cleaning.' },
  { icon: <Shield className="h-5 w-5" />, title: 'Role-based', desc: 'Each position has a fixed share. Head chef gets more than line cook. Clear hierarchy.' },
]

export default function ForTeamsPage() {
  return (
    <div className="min-h-screen bg-light text-dark-text pattern-wallet">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">For Teams</motion.p>
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-3">Tip splitting that just works</motion.h1>
              <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base mb-8 max-w-md">
                Set up automatic tip splits in 30 seconds. Every tip is divided instantly. Everyone sees their earnings. No more counting cash in the back.
              </motion.p>

              <div className="space-y-4 mb-8">
                {splitModels.map((m, i) => (
                  <motion.div key={m.title} variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">{m.icon}</div>
                    <div>
                      <h3 className="font-bold text-sm mb-1">{m.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp}>
                <Link to="/register" className="bg-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-hover transition-all active:scale-[0.97] inline-flex items-center gap-2 text-sm">
                  Set up your team <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>

            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="rounded-2xl overflow-hidden aspect-[16/10] bg-gray-100">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80&auto=format&fit=crop" alt="Team collaboration" className="h-full w-full object-cover" loading="lazy" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
                className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Today's tips</p>
                  <p className="text-lg font-bold font-mono-nums">₦50,000</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Adaeze O.', pct: 35, amount: '₦17,500', color: 'bg-accent' },
                    { name: 'Chidi N.', pct: 25, amount: '₦12,500', color: 'bg-accent2' },
                    { name: 'Funke A.', pct: 20, amount: '₦10,000', color: 'bg-success' },
                    { name: 'Tunde K.', pct: 20, amount: '₦10,000', color: 'bg-warning' },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{m.name}</span>
                          <span className="text-xs font-mono-nums font-medium">{m.amount}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
