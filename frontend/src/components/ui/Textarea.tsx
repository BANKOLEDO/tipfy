import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '~/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  maxLength?: number
  showCounter?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, maxLength, showCounter, value, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const count = typeof value === 'string' ? value.length : 0
    return (
      <div className="w-full">
        {label && <label htmlFor={textareaId} className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>}
        <textarea
          ref={ref} id={textareaId} value={value} maxLength={maxLength}
          className={cn(
            'w-full min-h-[80px] px-3 py-2.5 text-sm neo-input resize-none placeholder:text-text-muted transition-all duration-200',
            error && 'border-error focus:border-error', className
          )}
          {...props}
        />
        <div className="flex items-center justify-between mt-1">
          {error && <p className="text-xs text-error">{error}</p>}
          {showCounter && maxLength && (
            <p className={cn('text-xs text-text-muted ml-auto', count > maxLength * 0.9 && 'text-warning', count >= maxLength && 'text-error')}>
              {count}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
export { Textarea }
