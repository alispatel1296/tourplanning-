import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

export interface SidebarItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

export function Sidebar({
  items,
  header,
  footer,
  tone = 'light',
}: {
  items: SidebarItem[]
  header?: ReactNode
  footer?: ReactNode
  tone?: 'light' | 'dark'
}) {
  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col px-4 py-5',
        tone === 'dark' ? 'bg-navy' : 'border-r border-line bg-white',
      )}
    >
      {header}
      <nav className="mt-8 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                tone === 'dark'
                  ? isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  : isActive
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-600 hover:bg-slate-50',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </aside>
  )
}

export function TopNavbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur',
        className,
      )}
    >
      {children}
    </header>
  )
}
