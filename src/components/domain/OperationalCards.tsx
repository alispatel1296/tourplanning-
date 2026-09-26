import { MapPin, Sparkles } from 'lucide-react'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/Progress'
import { formatINR } from '@/lib/cn'
import type { Alternative, Conflict, TripNode } from '@/types'
import { cn } from '@/lib/cn'

export function ConflictCard({
  conflict,
  onResolve,
  onInvestigate,
  resolveLabel = 'Resolve conflict',
}: {
  conflict: Conflict
  onResolve?: () => void
  onInvestigate?: () => void
  resolveLabel?: string
}) {
  const tone = conflict.severity === 'high' ? 'danger' : conflict.severity === 'medium' ? 'warning' : 'info'

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="ai">
          <Sparkles className="h-3 w-3" />
          AI detected conflict
        </Badge>
        <Badge tone={tone}>{conflict.severity} risk</Badge>
        <StatusBadge status={conflict.state} />
      </div>
      <h3 className="card-title">{conflict.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{conflict.description}</p>
      <p className="meta mt-2">
        {conflict.tripTitle} · {conflict.city} · {conflict.owner}
      </p>
      {conflict.state !== 'resolved' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {onInvestigate ? (
            <Button type="button" variant="secondary" size="sm" onClick={onInvestigate}>
              Investigate
            </Button>
          ) : null}
          {onResolve ? (
            <Button type="button" size="sm" onClick={onResolve}>
              {resolveLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

export function BudgetMeter({ spent, budget }: { spent: number; budget: number }) {
  const pct = Math.round((spent / budget) * 100)
  const tone = pct > 92 ? 'danger' : pct > 80 ? 'warning' : 'success'
  return (
    <Card>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="meta">Budget used</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatINR(spent)}</p>
        </div>
        <p className="text-sm text-slate-500">of {formatINR(budget)}</p>
      </div>
      <ProgressBar value={pct} tone={tone} />
      <p className="meta mt-2">{formatINR(budget - spent)} remaining · {pct}% allocated</p>
    </Card>
  )
}

export function NodeCard({
  node,
  onVisit,
  onSkip,
}: {
  node: TripNode
  onVisit?: () => void
  onSkip?: () => void
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="meta">
            Day {node.day} · {node.time}
          </p>
          <h3 className="card-title mt-1">{node.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {node.city}
          </p>
        </div>
        <StatusBadge status={node.status} />
      </div>
      <p className="mt-3 text-sm text-slate-600">{node.notes}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-medium">{node.cost ? formatINR(node.cost) : 'Included'}</p>
        {node.status === 'upcoming' || node.status === 'active' ? (
          <div className="flex gap-2">
            {onSkip ? (
              <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
                Skip
              </Button>
            ) : null}
            {onVisit ? (
              <Button type="button" size="sm" onClick={onVisit}>
                Mark visited
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function AlternativeCard({
  alternative,
  onSelect,
}: {
  alternative: Alternative
  onSelect?: () => void
}) {
  return (
    <Card className={cn(alternative.selected && 'border-emerald-200 bg-emerald-50/40')}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="ai">AI suggested alternative</Badge>
        <Badge tone={alternative.risk === 'high' ? 'danger' : alternative.risk === 'medium' ? 'warning' : 'success'}>
          {alternative.risk} risk
        </Badge>
        {alternative.selected ? <Badge tone="success">Selected</Badge> : null}
      </div>
      <h3 className="card-title">{alternative.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{alternative.reason}</p>
      <p className="meta mt-2">{alternative.impact}</p>
      {!alternative.selected && onSelect ? (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={onSelect}>
          Select alternative
        </Button>
      ) : null}
    </Card>
  )
}
