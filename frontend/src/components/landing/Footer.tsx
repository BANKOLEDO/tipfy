import { Link } from 'react-router-dom'
import NairaCoinIcon from '~/components/NairaCoinIcon'

export default function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-accent flex items-center justify-center"><NairaCoinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" /></div>
              <span className="text-base sm:text-lg font-bold tracking-tight">tipfy</span>
            </Link>
            <p className="text-xs sm:text-sm text-text-muted max-w-[240px]">The simplest way to get tipped in Nigeria. Built for people who do real work.</p>
          </div>
          {[
            { title: 'Product', links: [{ label: 'Pricing', to: '/pricing' }, { label: 'For Teams', to: '/for-teams' }, { label: 'For Businesses', to: '/for-businesses' }] },
            { title: 'Company', links: [{ label: 'About', to: '/about' }, { label: 'Blog', to: '/blog' }, { label: 'Contact', to: '/contact' }] },
            { title: 'Legal', links: [{ label: 'Privacy Policy', to: '/privacy' }, { label: 'Terms of Service', to: '/terms' }, { label: 'Refund Policy', to: '/refund' }] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted mb-2.5 sm:mb-3">{col.title}</p>
              <ul className="space-y-1.5 sm:space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to} className="text-xs sm:text-sm text-text-secondary hover:text-text transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[10px] sm:text-xs text-text-muted">&copy; {new Date().getFullYear()} tipfy. All rights reserved.</p>
          <div className="flex items-center gap-3 sm:gap-4">
            {['Twitter', 'Instagram', 'LinkedIn'].map((s) => (
              <Link key={s} to="/" className="text-[10px] sm:text-xs text-text-muted hover:text-text transition-colors">{s}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}