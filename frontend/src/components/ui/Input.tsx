import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { cn } from '~/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  helper?: string
  light?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, helper, light, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className={cn('block text-sm font-medium mb-1.5', light ? 'text-gray-700' : 'text-text-secondary')}>{label}</label>}
        <div className="relative">
          {leftIcon && <div className={cn('absolute left-3 top-1/2 -translate-y-1/2', light ? 'text-gray-400' : 'text-text-muted')}>{leftIcon}</div>}
          <input
            ref={ref} id={inputId}
            className={cn(
              'w-full h-10 px-3 text-sm transition-all duration-200',
              light
                ? 'bg-white border border-gray-200 rounded-[var(--radius-md)] text-gray-900 placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none'
                : 'neo-input placeholder:text-text-muted',
              leftIcon && 'pl-10', rightIcon && 'pr-10',
              error && 'border-error focus:border-error',
              className
            )}
            {...props}
          />
          {rightIcon && <div className={cn('absolute right-3 top-1/2 -translate-y-1/2', light ? 'text-gray-400' : 'text-text-muted')}>{rightIcon}</div>}
        </div>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {helper && !error && <p className={cn('mt-1 text-xs', light ? 'text-gray-400' : 'text-text-muted')}>{helper}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export { Input }
