const items = [
  { label: 'QR code payments', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="10.5" y="10.5" width="3" height="3" rx="0.5"/></svg> },
  { label: 'Instant bank payouts', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h12"/><path d="M10 4l4 4-4 4"/></svg> },
  { label: 'No card reader needed', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4L4 12"/></svg> },
  { label: 'Bank transfer & USSD', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="10" height="8" rx="2"/><path d="M3 8h10"/></svg> },
  { label: 'Team tip splitting', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="2.5"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/></svg> },
  { label: 'Real-time analytics', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 12 5 8 8 10 11 5 14 3"/><circle cx="14" cy="3" r="1.2" fill="currentColor" stroke="none"/></svg> },
  { label: 'Bank-grade security', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="8" width="8" height="6" rx="1.5"/><path d="M6 8V6a2 2 0 014 0v2"/></svg> },
  { label: 'Works on any device', icon: <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="2" width="10" height="12" rx="2"/><path d="M7 12.5h2"/></svg> },
]

export default function TickerSection() {
  return (
    <section className="border-y border-border bg-dark-surface overflow-hidden">
      <div className="relative py-3 sm:py-3.5">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-dark-surface to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-dark-surface to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-0 w-max animate-marquee">
          {[...items, ...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              <span className="text-text-muted">{item.icon}</span>
              <span className="text-[11px] sm:text-xs text-text-muted font-medium tracking-wide whitespace-nowrap px-4 sm:px-5">{item.label}</span>
              <span className="text-accent/30 text-[6px] select-none">&#9670;</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
