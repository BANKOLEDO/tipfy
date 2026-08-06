import { useRef } from 'react'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export default function PinInput({ value, onChange, disabled, autoFocus }: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) return
    const next = value.slice(0, i) + digit
    onChange(next)
    if (i < 3) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1))
      } else if (i > 0) {
        refs.current[i - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 3) refs.current[i + 1]?.focus()
  }

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          value={value[i] || ''}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          maxLength={1}
          className={`w-12 h-14 text-center text-xl font-bold font-mono-nums rounded-2xl bg-gray-50 border-2 border-gray-100 text-dark-text focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all disabled:opacity-50 ${
            value[i] ? 'border-accent/60 bg-accent/[0.04]' : ''
          }`}
        />
      ))}
    </div>
  )
}
