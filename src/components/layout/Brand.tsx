import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function Brand({ compact = false, tone = 'light' }: { compact?: boolean; tone?: 'light' | 'dark' }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg',
          tone === 'dark' ? 'bg-white/10 text-white' : 'bg-brand-700 text-white',
        )}
      >
        <Sparkles className="h-4 w-4" />
      </span>
      {compact ? null : (
        <span className={cn('leading-tight', tone === 'dark' ? 'text-white' : 'text-ink')}>
          <span className="block font-display text-[15px] font-semibold tracking-tight">TripFlow</span>
          <span className={cn('block text-[10px] uppercase tracking-[0.14em]', tone === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
            AI
          </span>
        </span>
      )}
    </Link>
  )
}
