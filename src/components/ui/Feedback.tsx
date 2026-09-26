import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, Sparkles, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { StatusTone } from '@/types'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500">
        {icon}
      </div>
      <h3 className="card-title">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function LoadingSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

export function Notification({
  title,
  body,
  time,
  tone = 'neutral',
  read,
  onClick,
}: {
  title: string
  body: string
  time: string
  tone?: StatusTone
  read?: boolean
  onClick?: () => void
}) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    warning: <TriangleAlert className="h-4 w-4 text-amber-600" />,
    danger: <TriangleAlert className="h-4 w-4 text-rose-600" />,
    info: <Info className="h-4 w-4 text-electric-600" />,
    ai: <Sparkles className="h-4 w-4 text-brand-600" />,
    neutral: <Info className="h-4 w-4 text-slate-400" />,
  }

  return (
    <button
type="button"       onClick={onClick}
      className={cn(
        'flex w-full gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-slate-50',
        read ? 'border-transparent' : 'border-line bg-white',
      )}
    >
      <div className="mt-0.5">{icons[tone]}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-[13px] text-slate-500">{body}</p>
        <p className="meta mt-1">{time}</p>
      </div>
    </button>
  )
}

export interface ToastItem {
  id: string
  title: string
  body?: string
  tone?: StatusTone
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      className="fixed right-4 bottom-20 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 md:bottom-4"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-line bg-white p-3 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.body ? <p className="mt-0.5 text-[13px] text-slate-500">{toast.body}</p> : null}
              </div>
              <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Toast(props: ToastItem) {
  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold">{props.title}</p>
      {props.body ? <p className="mt-0.5 text-[13px] text-slate-500">{props.body}</p> : null}
    </div>
  )
}

export function HelpHint({ onClick }: { onClick?: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      Help
    </Button>
  )
}
