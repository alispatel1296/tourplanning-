import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function Brand({ compact = false, tone = 'light' }: { compact?: boolean; tone?: 'light' | 'dark' }) {
  return (
    <Link to="/" className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full shadow-sm',
            tone === 'dark' ? 'bg-white/10 text-[var(--color-muted-gold)]' : 'bg-[var(--color-charcoal)] text-[var(--color-muted-gold)]',
          )}
        >
          <Compass className="h-6 w-6" strokeWidth={1.5} />
        </span>
        {compact ? null : (
          <span className={cn('leading-none flex flex-col', tone === 'dark' ? 'text-white' : 'text-[var(--color-charcoal)]')}>
            <span className="font-display text-2xl tracking-wide font-semibold">TRIPFLOW</span>
            <span className={cn('text-[11px] font-sans tracking-[0.25em] mt-1 font-bold', tone === 'dark' ? 'text-white/60' : 'text-[var(--color-warm-brown)]')}>
              AI
            </span>
          </span>
        )}
    </Link>
  )
}
