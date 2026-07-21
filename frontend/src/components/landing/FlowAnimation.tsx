export default function FlowAnimation() {
  return (
    <div className="relative bg-bg-surface rounded-2xl sm:rounded-3xl border border-border overflow-hidden p-6 sm:p-10 lg:p-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 relative z-10">
        {/* Sender */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 w-[120px] sm:w-[140px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-text-secondary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-text text-center">Sender</p>
          <div className="bg-accent/10 rounded-full px-3 py-1">
            <p className="text-[11px] sm:text-xs font-bold text-accent font-mono-nums">₦2,000</p>
          </div>
        </div>

        {/* Arrow — dashed dots flowing left to right */}
        <div className="hidden sm:flex items-center gap-1 flex-1 max-w-[120px]">
          <div className="relative flex-1 flex items-center">
            {/* Dashed line */}
            <svg className="w-full h-4" viewBox="0 0 120 16" preserveAspectRatio="none">
              <line x1="0" y1="8" x2="120" y2="8" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 6" opacity="0.3" />
            </svg>
            {/* Traveling dot */}
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(37,99,235,0.6)]" style={{ animation: 'flow-dot 2s linear infinite' }} />
            {/* Traveling naira */}
            <div className="absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-accent drop-shadow-[0_0_4px_rgba(37,99,235,0.5)]" style={{ animation: 'flow-dot 2s linear infinite 0.5s' }}>₦</div>
          </div>
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-accent shrink-0" fill="currentColor"><path d="M6 3l5 5-5 5" /></svg>
        </div>

        {/* Arrow mobile — dashed dots flowing top to bottom */}
        <div className="sm:hidden flex flex-col items-center gap-1">
          <div className="relative h-8 w-px border-l-2 border-dashed border-accent/30">
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(37,99,235,0.5)]" style={{ animation: 'flow-dot-down 1.8s linear infinite' }} />
            <div className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold text-accent" style={{ animation: 'flow-dot-down 1.8s linear infinite 0.5s' }}>₦</div>
          </div>
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-accent rotate-90" fill="currentColor"><path d="M6 3l5 5-5 5" /></svg>
        </div>

        {/* Tipfy — pulses while receiving */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 w-[120px] sm:w-[140px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20" style={{ animation: 'flow-pulse 3s ease-in-out infinite' }}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-xs sm:text-sm font-bold text-accent">tipfy</p>
          <p className="text-[10px] sm:text-[11px] text-text-muted text-center">Secure &amp; instant</p>
        </div>

        {/* Arrow — dashed dots flowing left to right */}
        <div className="hidden sm:flex items-center gap-1 flex-1 max-w-[120px]">
          <div className="relative flex-1 flex items-center">
            <svg className="w-full h-4" viewBox="0 0 120 16" preserveAspectRatio="none">
              <line x1="0" y1="8" x2="120" y2="8" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 6" opacity="0.3" />
            </svg>
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(37,99,235,0.6)]" style={{ animation: 'flow-dot 2s linear infinite 0.3s' }} />
            <div className="absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-accent drop-shadow-[0_0_4px_rgba(37,99,235,0.5)]" style={{ animation: 'flow-dot 2s linear infinite 0.8s' }}>₦</div>
          </div>
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-accent shrink-0" fill="currentColor"><path d="M6 3l5 5-5 5" /></svg>
        </div>

        {/* Arrow mobile — dashed dots flowing top to bottom */}
        <div className="sm:hidden flex flex-col items-center gap-1">
          <div className="relative h-8 w-px border-l-2 border-dashed border-accent/30">
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(37,99,235,0.5)]" style={{ animation: 'flow-dot-down 1.8s linear infinite 0.3s' }} />
            <div className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold text-accent" style={{ animation: 'flow-dot-down 1.8s linear infinite 0.8s' }}>₦</div>
          </div>
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-accent rotate-90" fill="currentColor"><path d="M6 3l5 5-5 5" /></svg>
        </div>

        {/* Creator */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 w-[120px] sm:w-[140px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-text-secondary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-text text-center">Creator</p>
          <div className="bg-success/10 rounded-full px-3 py-1">
            <p className="text-[11px] sm:text-xs font-bold text-success">Received ✓</p>
          </div>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-accent/10" />
      <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-accent/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/[0.02] rounded-full blur-3xl pointer-events-none" />
    </div>
  )
}