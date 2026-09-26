import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="space-y-0">{children}</ol>
}

export function TimelineNode({
  title,
  meta,
  children,
  tone = 'neutral',
  last,
}: {
  title: string
  meta?: string
  children?: ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'neutral'
  last?: boolean
}) {
  const colors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-electric-500',
    ai: 'bg-brand-500',
    neutral: 'bg-slate-300',
  }

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={cn('mt-1 h-2.5 w-2.5 rounded-full', colors[tone])} />
        {!last ? <span className="w-px flex-1 bg-line" /> : null}
      </div>
      <div className={cn('min-w-0 pb-5', last && 'pb-0')}>
        <p className="card-title">{title}</p>
        {meta ? <p className="meta mt-0.5">{meta}</p> : null}
        {children}
      </div>
    </li>
  )
}
