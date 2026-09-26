import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { StatusTone } from '@/types'

const tones: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  info: 'bg-electric-50 text-electric-700 border-electric-100',
  ai: 'bg-brand-50 text-brand-800 border-brand-100',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
}

interface BadgeProps {
  tone?: StatusTone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const statusMap: Record<string, StatusTone> = {
  confirmed: 'success',
  active: 'success',
  completed: 'success',
  visited: 'success',
  feasible: 'success',
  'on-duty': 'success',
  available: 'success',
  assigned: 'info',
  offline: 'neutral',
  open: 'success',
  ready: 'success',
  booked: 'success',
  selected: 'success',
  resolved: 'success',
  pending: 'warning',
  paid: 'success',
  partial: 'warning',
  refunded: 'neutral',
  waitlisted: 'warning',
  planning: 'warning',
  investigating: 'warning',
  watch: 'warning',
  standby: 'warning',
  forming: 'warning',
  filling: 'warning',
  alternative: 'warning',
  dormant: 'neutral',
  draft: 'neutral',
  inactive: 'neutral',
  skipped: 'neutral',
  upcoming: 'info',
  live: 'info',
  ongoing: 'info',
  departing: 'info',
  departed: 'info',
  delayed: 'danger',
  cancelled: 'danger',
  failed: 'danger',
  disrupted: 'danger',
  full: 'danger',
  paused: 'danger',
  off: 'neutral',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusMap[status] ?? 'neutral'
  return (
    <Badge tone={tone} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace('-', ' ')}
    </Badge>
  )
}
