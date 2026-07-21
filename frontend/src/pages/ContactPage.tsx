import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-light text-dark-text pattern-bills">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 sm:gap-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="lg:col-span-2">
              <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">Contact</motion.p>
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-3">Get in touch</motion.h1>
              <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base mb-8">Have a question, want to partner, or just want to say hello? We'd love to hear from you.</motion.p>

              <div className="space-y-4">
                {[
                  { label: 'Email', value: 'hello@tipfy.com', sub: 'We respond within 24 hours' },
                  { label: 'Location', value: 'Lagos, Nigeria', sub: 'We work remotely across Nigeria' },
                  { label: 'Social', value: '@tipfyng', sub: 'DM us on Twitter or Instagram' },
                ].map((c, i) => (
                  <motion.div key={c.label} variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{c.label}</p>
                    <p className="text-sm font-medium">{c.value}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{c.sub}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="lg:col-span-3">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success mx-auto mb-3">
                    <Send className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-1.5">Message sent!</h3>
                  <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Name</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all" placeholder="you@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Subject</label>
                    <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all" placeholder="How can we help?" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Message</label>
                    <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-none" placeholder="Tell us more..." />
                  </div>
                  <button type="submit" className="bg-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-hover transition-all active:scale-[0.97] text-sm">
                    Send message
                  </button>
                </motion.form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
