import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

export function AILabel() {
  return (
    <Badge tone="ai">
      <Sparkles className="h-3 w-3" />
      AI
    </Badge>
  )
}

export function AIInsightCard({
  title,
  body,
  confidence,
  actionLabel,
  onAction,
  generating,
}: {
  title: string
  body: string
  confidence?: number
  actionLabel?: string
  onAction?: () => void
  generating?: boolean
}) {
  return (
    <div className={cn('rounded-xl border border-brand-100 bg-brand-50/70 p-4', generating && 'ai-generating')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <AILabel />
        {confidence ? <span className="meta">{Math.round(confidence * 100)}% confidence</span> : null}
      </div>
      <h3 className="card-title text-brand-950">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{body}</p>
      {actionLabel ? (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function AIRecommendationCard({
  title,
  body,
  children,
  onAccept,
}: {
  title: string
  body: string
  children?: ReactNode
  onAccept?: () => void
}) {
  return (
    <div className="ai-glow rounded-xl border border-brand-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700">
          AI Recommendation
        </p>
      </div>
      <h3 className="card-title">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
      {children}
      {onAccept ? (
        <Button type="button" variant="ai" size="sm" className="mt-3" onClick={onAccept}>
          Apply recommendation
        </Button>
      ) : null}
    </div>
  )
}
