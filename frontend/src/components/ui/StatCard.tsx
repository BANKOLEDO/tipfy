import { type ReactNode } from 'react'
import { cn } from '~/lib/utils'
export function StatCard({ label, value, icon, change, className }: { label: string; value: string | number; icon: ReactNode; change?: { value: number; type: 'increase' | 'decrease' }; className?: string }) {
  return (
    <div className={cn('neo-card-sm p-4 flex items-start gap-3', className)}>
      <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-text mt-0.5 font-mono-nums">{value}</p>
        {change && <p className={cn('text-xs mt-1 font-medium', change.type === 'increase' ? 'text-success' : 'text-error')}>
          {change.type === 'increase' ? '↑' : '↓'} {change.value}%
        </p>}
      </div>
    </div>
  )
}
