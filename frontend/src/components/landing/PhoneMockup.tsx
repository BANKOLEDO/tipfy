export default function PhoneMockup() {
  return (
    <div className="relative" style={{ animation: 'phone-float 4s ease-in-out infinite' }}>
      {/* Floating notification — cycles in */}
      <div className="absolute -left-28 top-24 z-30" style={{ animation: 'notif-slide 8s ease-in-out infinite' }}>
        <div className="bg-white rounded-2xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)] w-[180px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center">
              <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="#00B894" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3 3 7-7" /></svg>
            </div>
            <p className="text-[9px] font-semibold text-dark-text">New tip!</p>
          </div>
          <p className="text-base font-bold text-accent font-mono-nums">₦5,000</p>
          <p className="text-[8px] text-gray-400">From Adebayo K.</p>
        </div>
      </div>

      {/* Phone body */}
      <div className="relative w-[260px] h-[520px] rounded-[40px] bg-[#1A1A1A] p-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)]">
        {/* Side buttons */}
        <div className="absolute -left-[2px] top-[110px] w-[3px] h-[26px] bg-[#333] rounded-l-sm" />
        <div className="absolute -left-[2px] top-[150px] w-[3px] h-[46px] bg-[#333] rounded-l-sm" />
        <div className="absolute -left-[2px] top-[210px] w-[3px] h-[46px] bg-[#333] rounded-l-sm" />
        <div className="absolute -right-[2px] top-[170px] w-[3px] h-[56px] bg-[#333] rounded-r-sm" />

        {/* Screen */}
        <div className="relative w-full h-full rounded-[32px] bg-white overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[85px] h-[24px] bg-[#1A1A1A] rounded-full z-20" />

          {/* Status bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1">
            <span className="text-[10px] font-semibold text-dark-text">9:41</span>
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 16 11" className="w-3.5 h-2.5 fill-dark-text"><rect x="0" y="6" width="3" height="5" rx="0.8"/><rect x="4" y="3.5" width="3" height="7.5" rx="0.8"/><rect x="8" y="1.5" width="3" height="9.5" rx="0.8"/><rect x="12" y="0" width="3" height="11" rx="0.8"/></svg>
              <svg viewBox="0 0 16 11" className="w-4 h-2.5 fill-dark-text"><rect x="0.5" y="1" width="12" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1"/><rect x="13" y="3" width="2" height="5" rx="0.7"/><rect x="2" y="2.5" width="8" height="6" rx="1"/></svg>
            </div>
          </div>

          {/* App content */}
          <div className="h-full overflow-hidden pb-[52px]">
            {/* Header */}
            <div className="px-5 pt-2 pb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-dark-text">tipfy</p>
                    <p className="text-[8px] text-gray-400 -mt-0.5">Dashboard</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
              </div>
            </div>

            {/* Balance card */}
            <div className="mx-4 bg-accent rounded-2xl p-3.5 shadow-sm">
              <p className="text-[8px] text-white/60 uppercase tracking-wider font-medium">Total received</p>
              <p className="text-[22px] font-bold text-white font-mono-nums mt-0.5 leading-tight">₦127,500</p>
              <div className="inline-flex items-center gap-1 mt-1.5 bg-white/15 rounded-full px-2 py-0.5">
                <p className="text-[8px] text-white font-medium">+18% this month</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mx-4 mt-2.5">
              {[
                { icon: <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>, label: 'Receive' },
                { icon: <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, label: 'Withdraw' },
                { icon: <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>, label: 'Team' },
              ].map((a) => (
                <div key={a.label} className="flex-1 bg-gray-50 rounded-xl py-2 flex flex-col items-center gap-0.5">
                  <div className="text-gray-400">{a.icon}</div>
                  <p className="text-[7px] font-medium text-gray-500">{a.label}</p>
                </div>
              ))}
            </div>

            {/* Recent tips */}
            <div className="px-4 pt-3 pb-1.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-semibold text-dark-text uppercase tracking-wider">Recent tips</p>
                <p className="text-[8px] text-accent font-medium">View all</p>
              </div>
              {[
                { name: 'Chioma A.', amount: '₦5,000', time: '2m ago', msg: 'Great work!', color: 'bg-purple-100 text-purple-600', initials: 'CA' },
                { name: 'Adebayo K.', amount: '₦2,000', time: '15m ago', msg: 'Thanks!', color: 'bg-blue-100 text-blue-600', initials: 'AK' },
                { name: 'Fatima B.', amount: '₦10,000', time: '1h ago', msg: 'Keep going!', color: 'bg-emerald-100 text-emerald-600', initials: 'FB' },
                { name: 'Chidi O.', amount: '₦1,500', time: '3h ago', msg: '', color: 'bg-amber-100 text-amber-600', initials: 'CO' },
              ].map((tip, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${tip.color} flex items-center justify-center text-[8px] font-bold`}>{tip.initials}</div>
                    <div>
                      <p className="text-[9px] font-medium text-dark-text">{tip.name}</p>
                      <p className="text-[7px] text-gray-400">{tip.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-dark-text font-mono-nums">{tip.amount}</p>
                    {tip.msg && <p className="text-[6px] text-gray-300 italic">"{tip.msg}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 h-[52px] bg-white border-t border-gray-100 flex items-center justify-around px-4 z-10">
            {[
              { icon: <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Home', active: true },
              { icon: <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: 'Tips', active: false },
              { icon: <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Withdraw', active: false },
              { icon: <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, label: 'Settings', active: false },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-0.5">
                <div className={item.active ? 'text-accent' : 'text-gray-300'}>{item.icon}</div>
                <p className={`text-[6px] font-medium ${item.active ? 'text-accent' : 'text-gray-300'}`}>{item.label}</p>
                {item.active && <div className="w-3 h-0.5 rounded bg-accent mt-0.5" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating stats card — right */}
      <div className="absolute -right-20 top-32 z-30" style={{ animation: 'notif-slide-alt 10s ease-in-out infinite' }}>
        <div className="bg-white rounded-2xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)] w-[160px]">
          <p className="text-[8px] text-gray-400 uppercase tracking-wider mb-0.5 font-medium">Today</p>
          <p className="text-lg font-bold text-dark-text font-mono-nums">₦8,500</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '68%' }} />
            </div>
            <span className="text-[8px] text-success font-medium">+32%</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            <p className="text-[7px] text-gray-400">6 tips today</p>
          </div>
        </div>
      </div>
    </div>
  )
}