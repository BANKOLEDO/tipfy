import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, BarChart3, Users, Shield, Zap, Globe } from 'lucide-react'
import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const industries = [
  { title: 'Restaurants & Cafes', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop', desc: 'QR codes on every table. Tips split between kitchen and floor staff automatically.', stat: '2,400+ restaurants' },
  { title: 'Salons & Spas', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format&fit=crop', desc: 'Clients tip their stylist directly. The system handles the split with the salon.', stat: '1,800+ salons' },
  { title: 'Hotels & Hospitality', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80&auto=format&fit=crop', desc: 'Guests tip housekeeping, concierge, and restaurant staff via their phone.', stat: '650+ hotels' },
  { title: 'Retail & Events', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80&auto=format&fit=crop', desc: 'Display QR codes at checkout or project them on screen at events.', stat: '900+ locations' },
]

const enterpriseFeatures = [
  { icon: <Building2 className="h-5 w-5" />, title: 'Multi-location dashboard', desc: 'Manage all branches from one screen.' },
  { icon: <BarChart3 className="h-5 w-5" />, title: 'Financial reporting', desc: 'Export tax-ready reports for your accountant.' },
  { icon: <Users className="h-5 w-5" />, title: 'Staff management', desc: 'Onboard staff, assign roles, track performance.' },
  { icon: <Shield className="h-5 w-5" />, title: 'Compliance & audit', desc: 'KYC verification and audit logs built in.' },
  { icon: <Zap className="h-5 w-5" />, title: 'API & webhooks', desc: 'Integrate tipping data into your existing systems.' },
  { icon: <Globe className="h-5 w-5" />, title: 'Custom branding', desc: 'White-label with your logo, colors, and messaging.' },
]

export default function ForBusinessesPage() {
  return (
    <div className="min-h-screen bg-light text-dark-text pattern-coins">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 sm:gap-16 items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="lg:col-span-2">
              <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">For Businesses</motion.p>
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-3">Tipping infrastructure for your business</motion.h1>
              <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base mb-8">
                Accept tips across all locations. Manage staff earnings. Get the reporting you need. Built for Nigerian businesses.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/register" className="bg-accent text-white px-5 py-3 rounded-xl font-medium hover:bg-accent-hover transition-all active:scale-[0.97] inline-flex items-center justify-center gap-2 text-sm">
                  Start business account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="border border-gray-200 text-dark-text px-5 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-[0.97] text-sm text-center">
                  Talk to sales
                </Link>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                {enterpriseFeatures.map((f, i) => (
                  <motion.div key={f.title} variants={fadeUp} className="bg-white border border-gray-100 rounded-lg p-3">
                    <div className="text-accent mb-1.5">{f.icon}</div>
                    <h4 className="text-xs font-bold mb-0.5">{f.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              {industries.map((ind, i) => (
                <motion.div key={ind.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={ind.image} alt={ind.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-bold text-sm">{ind.title}</h3>
                      <span className="text-[10px] text-accent font-medium">{ind.stat}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{ind.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
