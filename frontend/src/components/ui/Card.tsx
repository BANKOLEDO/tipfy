import { type ReactNode } from 'react'
import { cn } from '~/lib/utils'

function Card({ variant = 'elevated', padding = 'md', children, className, onClick }: {
  variant?: 'elevated' | 'flat' | 'bordered'; padding?: 'sm' | 'md' | 'lg' | 'none'
  children: ReactNode; className?: string; onClick?: () => void
}) {
  return (
    <div onClick={onClick} className={cn(
      variant === 'elevated' && 'neo-elevated', variant === 'flat' && 'bg-bg-surface',
      variant === 'bordered' && 'border border-border rounded-[var(--radius-lg)]',
      padding === 'sm' && 'p-2', padding === 'md' && 'p-4', padding === 'lg' && 'p-6', padding === 'none' && 'p-0',
      onClick && 'cursor-pointer hover:border-border-hover transition-colors duration-200', className
    )}>{children}</div>
  )
}

function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-text', className)}>{children}</h3>
}

function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export { Card, CardHeader, CardTitle, CardContent }
