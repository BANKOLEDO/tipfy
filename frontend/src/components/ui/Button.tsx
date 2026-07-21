import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '~/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-glow-sm hover:shadow-glow',
        variant === 'secondary' && 'bg-accent2 text-white hover:bg-accent2-hover active:scale-[0.98]',
        variant === 'outline' && 'bg-transparent border border-border text-text hover:border-border-hover hover:bg-bg-surface active:scale-[0.98]',
        variant === 'ghost' && 'bg-transparent text-text-secondary hover:text-text hover:bg-bg-surface active:scale-[0.98]',
        variant === 'destructive' && 'bg-error text-white hover:bg-error/90 active:scale-[0.98]',
        size === 'sm' && 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
        size === 'md' && 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
        size === 'lg' && 'h-12 px-6 text-base rounded-[var(--radius-lg)]',
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export { Button }
