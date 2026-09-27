import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, CloudRain, RefreshCw, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn, formatINR } from '@/lib/cn'
import { composeDayReplan, type ReplanProposal } from '@/services/twin/dayReplan'
import type { TwinSnapshot } from '@/services/twin/weatherModel'
import type { Trip } from '@/types'

export function AbnormalityReplanPanel({
  trip,
  snapshot,
  compact = false,
  onApply,
  onReset,
}: {
  trip: Trip
  snapshot: TwinSnapshot | null
  compact?: boolean
  onApply: (proposal: ReplanProposal) => void
  onReset?: () => void
}) {
  const [force, setForce] = useState(false)
  const [applied, setApplied] = useState(false)
  const proposal = useMemo(() => composeDayReplan(trip, snapshot, force), [trip, snapshot, force])
  const already = trip.nodes.some((node) => node.id.startsWith('replan-') && node.status !== 'alternative')

  useEffect(() => {
    if (already) setApplied(true)
  }, [already])

  if (applied || already) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">Replan on the path</p>
        <h3 className="mt-1 font-display text-xl text-ink">Weather rewrite is applied from the wet day</h3>
        <p className="mt-1 text-sm text-slate-600">
          Outdoor hops from that morning are indoor holds. Originals stay on the list as disrupted so you can show what
          changed. Hotels and flights stay booked.
        </p>
        {onReset ? (
          <Button
            type="button"
            className="mt-3"
            variant="secondary"
            onClick={() => {
              onReset()
              setApplied(false)
              setForce(false)
            }}
          >
            Reset weather path
          </Button>
        ) : null}
      </Card>
    )
  }

  if (!proposal) {
    return (
      <Card>
        <p className="card-title">Abnormality watch</p>
        <p className="meta mt-1">No outdoor hop left to replan on this circuit.</p>
      </Card>
    )
  }

  const save = proposal.budgetDelta < 0

  return (
    <Card className={cn(proposal.live ? 'border-rose-200 bg-rose-50/40' : 'border-amber-200 bg-amber-50/40')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">Auto replan · from that day</p>
          <h3 className="mt-1 font-display text-xl text-ink">{proposal.headline}</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{proposal.summary}</p>
        </div>
        <Badge tone={proposal.live ? 'danger' : 'warning'}>{proposal.live ? 'Live cell' : 'Seeded corridor'}</Badge>
      </div>

      <div className={cn('mt-4 grid gap-3', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4')}>
        <Metric label="From day" value={`Day ${proposal.fromDay}`} hint={proposal.city} />
        <Metric label="Rain / flood" value={`${proposal.rainfallMmH.toFixed(1)} mm/h`} hint={`Flood ${Math.round(proposal.floodIndex)}`} />
        <Metric
          label="Budget change"
          value={`${proposal.budgetDelta > 0 ? '+' : proposal.budgetDelta < 0 ? '−' : ''}${formatINR(Math.abs(proposal.budgetDelta))}`}
          hint={save ? 'Indoor tickets cost less' : proposal.budgetDelta === 0 ? 'Timing only' : 'Covered hold costs more'}
          tone={save ? 'good' : proposal.budgetDelta > 0 ? 'bad' : 'neutral'}
        />
        <Metric label="Remaining after apply" value={formatINR(Math.max(0, proposal.remainingAfter))} hint={`${Math.round(proposal.confidence * 100)}% confidence`} />
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Changes from Day {proposal.fromDay}</p>
        {proposal.changes.map((change) => (
          <div key={change.id} className="rounded-xl border border-white/80 bg-white/80 px-3 py-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Day {change.day} · {change.city} · {change.kind}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {change.fromTitle} → {change.toTitle}
                </p>
                <p className="mt-1 text-[12px] text-slate-600">{change.reason}</p>
              </div>
              <p className={cn('text-sm font-semibold', change.budgetDelta < 0 ? 'text-emerald-700' : change.budgetDelta > 0 ? 'text-rose-700' : 'text-slate-500')}>
                {change.budgetDelta === 0 ? '₹0' : `${change.budgetDelta > 0 ? '+' : '−'}${formatINR(Math.abs(change.budgetDelta))}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {compact ? null : (
        <div className="mt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <BrainCircuit className="h-4 w-4 text-brand-700" />
            Why the twin chose this
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] text-slate-700">
            {proposal.explanations.map((item) => (
              <li key={item.title}>
                <span className="font-semibold">{item.title}.</span> {item.body}
              </li>
            ))}
          </ol>
          <p className="meta mt-2">{proposal.source} · trigger {proposal.triggerTitle}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={applied}
          icon={<Sparkles className="h-4 w-4" />}
          onClick={() => {
            onApply(proposal)
            setApplied(true)
          }}
        >
          {applied ? 'Changes applied' : 'Apply replan'}
        </Button>
        <Button type="button" variant="secondary" icon={<CloudRain className="h-4 w-4" />} onClick={() => setForce(true)}>
          Force high-rain corridor
        </Button>
        <Button type="button" variant="ghost" icon={<RefreshCw className="h-4 w-4" />} onClick={() => setForce(false)}>
          Use live cell
        </Button>
      </div>
    </Card>
  )
}

function Metric({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint: string
  tone?: 'good' | 'bad' | 'neutral'
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-display text-xl',
          tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : 'text-ink',
        )}
      >
        {value}
      </p>
      <p className="text-[12px] text-slate-500">{hint}</p>
    </div>
  )
}
