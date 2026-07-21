import { cn, getInitials } from '~/lib/utils'
export function Avatar({ src, name, size = 'md', className }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-xl' }
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  return <div className={cn('rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center', sizes[size], className)}>{getInitials(name)}</div>
}
