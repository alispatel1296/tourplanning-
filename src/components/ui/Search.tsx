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
      <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-300"
      />
    </label>
  )
}
