import { Link, useLocation } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuthStore } from '~/lib/store'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { to: '/pricing', label: 'Pricing' },
  { to: '/for-teams', label: 'Teams' },
  { to: '/for-businesses', label: 'Business' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
]

export default function Nav() {
  const { isAuthenticated } = useAuthStore()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = (to: string) => pathname === to

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3 sm:pt-4">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-2xl border border-gray-200/60 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] px-4 sm:px-5 h-13 sm:h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-dark-text">tipfy</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive(l.to)
                    ? 'text-accent bg-accent/8'
                    : 'text-gray-500 hover:text-dark-text hover:bg-gray-100/60'
                }`}>
                {l.label}
                {isActive(l.to) && (
                  <motion.div layoutId="nav-active" className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden md:block text-xs text-gray-500 hover:text-dark-text px-3 py-1.5 rounded-lg hover:bg-gray-100/60 transition-all duration-200">
              Log in
            </Link>
            <Link to={isAuthenticated ? '/dashboard' : '/register'}
              className="bg-accent text-white px-3.5 sm:px-4 py-1.5 sm:py-[7px] rounded-xl text-xs font-medium hover:bg-accent-hover hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:scale-[0.96] transition-all duration-200">
              {isAuthenticated ? 'Dashboard' : 'Get Started'}
            </Link>

            {/* Mobile hamburger */}
            <button onClick={() => setOpen(!open)} className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] -mr-1 rounded-lg hover:bg-gray-100/60 transition-colors">
              <motion.span animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} className="block w-4 h-[1.5px] bg-dark-text rounded-full origin-center" transition={{ duration: 0.2 }} />
              <motion.span animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} className="block w-4 h-[1.5px] bg-dark-text rounded-full origin-center" transition={{ duration: 0.15 }} />
              <motion.span animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} className="block w-4 h-[1.5px] bg-dark-text rounded-full origin-center" transition={{ duration: 0.2 }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[72px] sm:top-[76px] left-4 right-4 z-50 bg-white/95 backdrop-blur-2xl border border-gray-200/60 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] p-3 md:hidden"
          >
            <div className="space-y-0.5">
              {links.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={l.to} onClick={() => setOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(l.to)
                        ? 'text-accent bg-accent/8'
                        : 'text-gray-600 hover:text-dark-text hover:bg-gray-100'
                    }`}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <Link to="/login" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-dark-text hover:bg-gray-100 transition-all duration-200">
                Log in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)} className="fixed inset-0 z-40 md:hidden" />
        )}
      </AnimatePresence>
    </>
  )
}
