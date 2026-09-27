import { useMemo, useState } from 'react'
import {
  Check,
  Compass,
  Hotel,
  Plane,
  Plus,
  TrainFront,
  UtensilsCrossed,
  Waves,
} from 'lucide-react'
import { formatINR, cn } from '@/lib/cn'
import { nodeDuration, type CanvasView, type PathMode } from '@/pages/traveler/flow/model'
import { nodeImage, type VisualBranch } from '@/pages/traveler/flow/dossier'
import type { TripNode } from '@/types'

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=70'

const TYPE_CONFIG: Record<
  TripNode['category'],
  { label: string; color: string; bg: string; icon: typeof Hotel }
> = {
  transport: { label: 'Move', color: '#7EB6FF', bg: 'rgba(126, 182, 255, 0.16)', icon: TrainFront },
  stay: { label: 'Stay', color: '#C4B5FD', bg: 'rgba(196, 181, 253, 0.16)', icon: Hotel },
  food: { label: 'Eat', color: '#F0B27A', bg: 'rgba(240, 178, 122, 0.16)', icon: UtensilsCrossed },
  activity: { label: 'Do', color: '#6EE7B7', bg: 'rgba(110, 231, 183, 0.16)', icon: Waves },
  free: { label: 'Free', color: '#FDE68A', bg: 'rgba(253, 230, 138, 0.16)', icon: Compass },
}

function roleOf(node: TripNode, nodes: TripNode[]) {
  if (node.status === 'visited') return 'done' as const
  if (node.status === 'active') return 'now' as const
  if (node.status === 'disrupted') return 'hold' as const
  const next = nodes.find((item) => item.status === 'upcoming')
  if (next?.id === node.id) return 'next' as const
  return 'later' as const
}

export function FlowCanvas({
  nodes,
  path: _path,
  selectedId,
  view,
  zoom,
  branches,
  onSelect,
  onAdd,
  onSelectBranch,
}: {
  nodes: TripNode[]
  path: PathMode
  selectedId: string | null
  view: CanvasView
  zoom: number
  branches: VisualBranch[]
  onSelect: (id: string) => void
  onAdd: (afterId: string) => void
  onSelectBranch: (branch: VisualBranch) => void
}) {
  const main = useMemo(() => nodes.filter((node) => node.status !== 'alternative'), [nodes])
  const days = useMemo(() => groupDays(main), [main])

  if (view === 'timeline') {
    return (
      <div className="space-y-4 overflow-auto p-4">
        <Legend />
        {main.map((node, index) => (
          <div key={node.id} className="flex items-start gap-3">
            <StoryCard
              node={node}
              role={roleOf(node, main)}
              selected={selectedId === node.id}
              onSelect={() => onSelect(node.id)}
            />
            {index < main.length - 1 ? (
              <button
                type="button"
                aria-label="Add hop after this node"
                onClick={() => onAdd(node.id)}
                className="mt-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 text-emerald-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative min-h-[620px] overflow-auto bg-[#0b1220] text-[#F3EFE7]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(243, 239, 231, 0.05) 1px, transparent 1px), linear-gradient(180deg, rgba(63,167,114,0.08), transparent 280px)',
          backgroundSize: '22px 22px, 100% 100%',
        }}
      />

      <div className="relative origin-top-left p-5" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <Legend />

        <div className="mt-5 flex min-w-max items-start gap-4 pb-8">
          {days.map((day, dayIndex) => {
            const city = day.nodes[0]?.city ?? ''
            const date = day.nodes[0]?.date
            const hasNow = day.nodes.some((node) => node.status === 'active')
            const allDone = day.nodes.every((node) => node.status === 'visited')
            return (
              <div key={day.day} className="flex items-start gap-4">
                <section
                  id={`canvas-day-${day.day}`}
                  className={cn(
                    'w-[280px] rounded-3xl border p-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)]',
                    hasNow
                      ? 'border-emerald-400/50 bg-[#122033]'
                      : allDone
                        ? 'border-white/5 bg-[#101827]/80'
                        : 'border-white/10 bg-[#121a2b]',
                  )}
                >
                  <header className="mb-3 flex items-center justify-between gap-2 px-1">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">
                        Day {day.day}
                        {date ? ` · ${date.slice(8, 10)} ${month(date)}` : ''}
                      </p>
                      <p className="font-display text-xl text-white">{city}</p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                        hasNow ? 'bg-emerald-500 text-white' : allDone ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-slate-300',
                      )}
                    >
                      {hasNow ? 'Today' : allDone ? 'Done' : 'Ahead'}
                    </span>
                  </header>

                  <div className="relative space-y-3 pl-4">
                    <span className="absolute bottom-3 left-[11px] top-3 w-px bg-gradient-to-b from-emerald-400 via-emerald-400/40 to-white/10" />
                    {day.nodes.map((node) => {
                      const role = roleOf(node, main)
                      const alts = branches.filter((branch) => branch.parentId === node.id)
                      return (
                        <div key={node.id} className="relative">
                          <span
                            className={cn(
                              'absolute -left-4 top-6 z-10 h-2.5 w-2.5 rounded-full border-2 border-[#121a2b]',
                              role === 'done' && 'bg-emerald-400',
                              role === 'now' && 'bg-emerald-300 shadow-[0_0_12px_#34d399]',
                              role === 'next' && 'bg-sky-300',
                              role === 'later' && 'bg-slate-500',
                              role === 'hold' && 'bg-rose-400',
                            )}
                          />
                          <StoryCard
                            node={node}
                            role={role}
                            selected={selectedId === node.id}
                            onSelect={() => onSelect(node.id)}
                          />
                          {alts.map((branch) => (
                            <button
                              key={branch.id}
                              type="button"
                              onClick={() => onSelectBranch(branch)}
                              className={cn(
                                'mt-2 w-full rounded-2xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-left',
                                selectedId === branch.id && 'ring-2 ring-amber-300',
                              )}
                            >
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200">Optional swap</p>
                              <p className="truncate text-sm font-semibold text-white">{branch.title}</p>
                              <p className="truncate text-[11px] text-slate-300">{branch.subtitle}</p>
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-label="Add hop after this node"
                            onClick={() => onAdd(node.id)}
                            className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 py-1.5 text-[11px] font-semibold text-slate-400 hover:border-emerald-400/50 hover:text-emerald-200"
                          >
                            <Plus className="h-3 w-3" />
                            Add a stop
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {dayIndex < days.length - 1 ? (
                  <div className="mt-24 flex w-10 flex-col items-center text-emerald-300">
                    <span className="h-px w-8 bg-emerald-400/70" />
                    <span className="my-1 text-[10px] font-bold uppercase tracking-wider">Then</span>
                    <span className="h-px w-8 bg-emerald-400/70" />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#101827]/90 px-4 py-3 text-[12px] text-slate-300">
      <p className="mr-2 font-semibold text-white">How to read this journey</p>
      <LegendDot className="bg-emerald-400" label="Done" />
      <LegendDot className="bg-emerald-300 shadow-[0_0_10px_#34d399]" label="You are here" />
      <LegendDot className="bg-sky-300" label="Next" />
      <LegendDot className="bg-slate-500" label="Later" />
      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-amber-100">Gold = optional swap</span>
      <span className="text-slate-400">Read left to right, morning to night.</span>
    </div>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full', className)} />
      {label}
    </span>
  )
}

function StoryCard({
  node,
  role,
  selected,
  onSelect,
}: {
  node: TripNode
  role: 'done' | 'now' | 'next' | 'later' | 'hold'
  selected: boolean
  onSelect: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const typeCfg = TYPE_CONFIG[node.category] ?? TYPE_CONFIG.activity
  const Icon = node.category === 'transport' && /flight|indigo|6e/i.test(node.title) ? Plane : typeCfg.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full overflow-hidden rounded-2xl border bg-[#162033] text-left shadow-lg transition',
        selected && 'ring-2 ring-emerald-300',
        role === 'now' && 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.25)]',
        role === 'done' && 'border-emerald-500/30 opacity-80',
        role === 'next' && 'border-sky-400/40',
        role === 'later' && 'border-white/10',
        role === 'hold' && 'border-rose-400/50',
      )}
    >
      <span className="flex gap-2.5 p-2.5">
        <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-[#0b1220]">
          <img
            src={imgError ? FALLBACK_IMG : nodeImage(node)}
            onError={() => setImgError(true)}
            alt=""
            className="h-full w-full object-cover"
          />
          {role === 'done' ? (
            <span className="absolute inset-0 flex items-center justify-center bg-emerald-500/80 text-white">
              <Check className="h-5 w-5" />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
              style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}
            >
              <Icon className="h-3 w-3" />
              {typeCfg.label}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                role === 'done' && 'bg-emerald-500/20 text-emerald-200',
                role === 'now' && 'bg-emerald-500 text-white',
                role === 'next' && 'bg-sky-500/20 text-sky-200',
                role === 'later' && 'bg-white/5 text-slate-400',
                role === 'hold' && 'bg-rose-500/20 text-rose-200',
              )}
            >
              {role === 'done' ? 'Done' : role === 'now' ? 'Now' : role === 'next' ? 'Next' : role === 'hold' ? 'Hold' : 'Later'}
            </span>
          </span>
          <span className="mt-1 block truncate text-[14px] font-bold text-white">{node.title}</span>
          <span className="block truncate text-[11px] text-slate-400">
            {node.time} · {node.city}
          </span>
          <span className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-slate-400">{node.notes || nodeDuration(node)}</span>
            <span className="shrink-0 text-[12px] font-extrabold text-emerald-300">
              {node.cost ? formatINR(node.cost) : 'Included'}
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}

function groupDays(nodes: TripNode[]) {
  const map = new Map<number, { day: number; nodes: TripNode[] }>()
  nodes.forEach((node) => {
    const current = map.get(node.day) ?? { day: node.day, nodes: [] }
    current.nodes.push(node)
    map.set(node.day, current)
  })
  return [...map.values()].sort((a, b) => a.day - b.day)
}

function month(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleString('en-IN', { month: 'short' })
}
