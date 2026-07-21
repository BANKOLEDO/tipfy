import { cn } from '~/lib/utils'
export function Badge({ variant = 'default', children, className }: { variant?: 'default' | 'success' | 'warning' | 'error' | 'info'; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
      variant === 'default' && 'bg-bg-elevated text-text-secondary border border-border',
      variant === 'success' && 'bg-success-dim text-success',
      variant === 'warning' && 'bg-warning-dim text-warning',
      variant === 'error' && 'bg-error-dim text-error',
      variant === 'info' && 'bg-info/15 text-info',
      className
    )}>{children}</span>
  )
}
