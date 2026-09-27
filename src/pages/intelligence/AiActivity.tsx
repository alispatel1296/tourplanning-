import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AILabel } from '@/components/domain/AICards'
import { cn } from '@/lib/cn'
import { activityBeats, engines } from '@/pages/intelligence/catalog'

export function AiActivityPanel() {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="card-title">AI Activity</p>
          <AILabel />
        </div>
        <p className="meta mt-1">Shared intelligence layer · every pulse is explainable</p>
      </div>

      <div className="grid gap-2 px-4 py-3 sm:grid-cols-2">
        {engines.map((engine) => (
          <div key={engine.id} className="rounded-xl border border-line px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold">{engine.name}</p>
              <span className={cn('h-2 w-2 rounded-full', engine.live ? 'bg-emerald-500' : 'bg-slate-300')} />
            </div>
            <p className="meta mt-1">{engine.state}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Engine room</p>
        <ol className="mt-3 space-y-3">
          {activityBeats.map((beat) => (
            <li key={`${beat.time}-${beat.body}`} className="flex gap-3">
              <span className="w-12 shrink-0 font-mono text-[12px] font-semibold text-brand-700">{beat.time}</span>
              <span className="text-sm text-slate-700">{beat.body}</span>
            </li>
          ))}
        </ol>
        <Badge tone="ai" className="mt-4">
          Live pulse · not a hidden model
        </Badge>
      </div>
    </Card>
  )
}
