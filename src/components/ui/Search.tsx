import { Search as SearchIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Search({
  value,
  onChange,
  placeholder = 'Search',
  className,
  onFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onFocus?: () => void
}) {
  return (
    <label className={cn('relative flex min-w-0 items-center', className)}>
      <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--color-charcoal)]/40" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[var(--color-muted-gold)]/30 bg-transparent pl-9 pr-3 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal)]/40 focus:outline-none focus:border-[var(--color-muted-gold)] focus:ring-2 focus:ring-[var(--color-muted-gold)]/10 transition-all"
      />
    </label>
  )
}
