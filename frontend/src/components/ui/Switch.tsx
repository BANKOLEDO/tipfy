import { cn } from '~/lib/utils'
export function Switch({ checked, onCheckedChange, label, disabled = false, className }: { checked: boolean; onCheckedChange: (c: boolean) => void; label?: string; disabled?: boolean; className?: string }) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200', checked ? 'bg-accent' : 'bg-border')}>
        <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  )
}
