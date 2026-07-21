import { motion } from 'framer-motion'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function EditorialSection() {
  return (
    <section className="py-16 sm:py-24 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-5 gap-8 sm:gap-12 items-center">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <p className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2 sm:mb-3">For everyone</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              A barber. A chef.<br />A creator. A driver.
            </h2>
            <p className="text-text-secondary mt-3 sm:mt-4 max-w-sm leading-relaxed text-sm sm:text-base">
              tipfy isn't built for "influencers." It's built for anyone who does work worth paying extra for. Your barista. Your hairstylist. Your favourite Twitter thread writer.
            </p>
            <div className="mt-6 sm:mt-8 flex items-center gap-6 sm:gap-8">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-accent font-mono-nums">12</p>
                <p className="text-[10px] sm:text-xs text-text-muted">Categories</p>
              </div>
              <div className="h-8 sm:h-10 w-px bg-border" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-accent font-mono-nums">∞</p>
                <p className="text-[10px] sm:text-xs text-text-muted">Possibilities</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-bg-surface relative">
              <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&auto=format&fit=crop" alt="People collaborating" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-bg-surface/95 backdrop-blur-sm border border-border rounded-xl p-3 sm:p-4 max-w-[170px] sm:max-w-[200px]">
                <p className="text-[9px] sm:text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Avg. tip</p>
                <p className="text-lg sm:text-xl font-bold text-accent font-mono-nums">₦1,800</p>
                <p className="text-[9px] sm:text-[10px] text-success font-medium mt-0.5">↑ 23% this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}