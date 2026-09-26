import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-[13px] text-slate-500">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-1">
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-700">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
          {index < items.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
        </span>
      ))}
    </nav>
  )
}
