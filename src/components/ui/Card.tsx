import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  padded?: boolean
  onClick?: () => void
}

export function Card({ children, className, padded = true, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        padded && 'p-5',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'ai' | 'info'
}

const metricTone = {
  default: 'bg-slate-50 text-slate-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-600',
  ai: 'bg-brand-50 text-brand-700',
  info: 'bg-electric-50 text-electric-700',
}

export function MetricCard({ label, value, hint, icon, tone = 'default' }: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="meta">{label}</p>
          <p className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-ink">{value}</p>
          {hint ? <p className="mt-1 text-[13px] text-slate-500">{hint}</p> : null}
        </div>
        {icon ? (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', metricTone[tone])}>
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
