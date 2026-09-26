import { Check, Hotel, Plane, TrainFront, UtensilsCrossed, Waves, Compass, AlertTriangle } from 'lucide-react'
import { formatINR } from '@/lib/cn'
import { cn } from '@/lib/cn'
import { nodeDuration } from '@/pages/traveler/flow/model'
import type { TripNode } from '@/types'

const icons = {
  transport: TrainFront,
  stay: Hotel,
  food: UtensilsCrossed,
  activity: Waves,
  free: Compass,
}

export function LiveFlow({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: TripNode[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="relative min-h-[500px] overflow-auto app-scrollbar bg-[#101823] text-[#F3EFE7] p-4">
      <div className="mx-auto max-w-md space-y-0">
        {nodes.map((node, index) => (
          <div key={node.id} className="relative">
            <LiveNodeCard
              node={node}
              selected={selectedId === node.id}
              onSelect={() => onSelect(node.id)}
            />
            {index < nodes.length - 1 ? (
              <div className="flex h-10 flex-col items-center justify-center">
                <span className={cn('h-full w-0.5 transition-colors', connectorTone(node, nodes[index + 1]))} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveNodeCard({
  node,
  selected,
  onSelect,
}: {
  node: TripNode
  selected: boolean
  onSelect: () => void
}) {
  const Icon = node.title.includes('IndiGo') ? Plane : icons[node.category] ?? Compass
  const visited = node.status === 'visited'
  const current = node.status === 'active'
  const disrupted = node.status === 'disrupted'
  const alternative = node.status === 'alternative'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full gap-3 rounded-2xl border bg-[#16212F] p-3 text-left shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all hover:border-[#3FA772]',
        visited && 'border-[#3FA772]/60 bg-[#16212F]',
        current && 'border-[#3FA772] ring-2 ring-[#3FA772]/30 shadow-[0_0_24px_rgba(63,167,114,0.3)] bg-[#1a293b]',
        disrupted && 'border-[#C96A4B] bg-[#C96A4B]/10',
        alternative && 'border-[#E0A63A] bg-[#E0A63A]/10',
        !visited && !current && !disrupted && !alternative && 'border-slate-800 bg-[#16212F]',
        selected && 'ring-2 ring-[#3FA772] border-[#3FA772]',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-all',
          visited && 'bg-[#3FA772] text-white',
          current && 'bg-[#3FA772] text-white shadow-md animate-pulse',
          disrupted && 'bg-[#C96A4B] text-white',
          alternative && 'bg-[#E0A63A] text-slate-950',
          !visited && !current && !disrupted && !alternative && 'bg-slate-800 text-slate-400',
        )}
      >
        {visited ? <Check className="h-5 w-5" /> : disrupted ? <AlertTriangle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-[#F3EFE7] group-hover:text-white">{node.title}</p>
          <LiveBadge node={node} />
        </div>

        <p className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{node.city} · {node.time}</span>
          <span className="font-extrabold text-[#3FA772]">{node.cost ? formatINR(node.cost) : 'Included'}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400 truncate">{nodeDuration(node)} · {node.notes}</p>
      </div>
    </button>
  )
}

function LiveBadge({ node }: { node: TripNode }) {
  if (node.status === 'visited') {
    return (
      <span className="rounded-md bg-[#3FA772]/20 border border-[#3FA772]/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#3FA772]">
        Visited ✓
      </span>
    )
  }
  if (node.status === 'active') {
    return (
      <span className="rounded-md bg-[#3FA772] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-xs">
        Active Now
      </span>
    )
  }
  if (node.status === 'disrupted') {
    return (
      <span className="rounded-md bg-[#C96A4B]/20 border border-[#C96A4B]/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#C96A4B]">
        Disrupted
      </span>
    )
  }
  if (node.status === 'alternative') {
    return (
      <span className="rounded-md bg-[#E0A63A]/20 border border-[#E0A63A]/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#E0A63A]">
        Alternative
      </span>
    )
  }
  return (
    <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-400">
      Upcoming
    </span>
  )
}

function connectorTone(from: TripNode, to: TripNode) {
  if (from.status === 'disrupted' || to.status === 'disrupted') return 'bg-[#C96A4B]'
  if (to.status === 'alternative' || from.status === 'alternative') return 'bg-[#E0A63A]'
  if (from.status === 'visited' || from.status === 'active') return 'bg-[#3FA772]'
  return 'bg-slate-800'
}
