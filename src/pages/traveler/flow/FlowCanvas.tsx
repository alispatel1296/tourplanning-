import { useState } from 'react'
import {
  Car,
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

const CARD_W = 240
const CARD_H = 114
const COL = 88
const ROW = 270
const ALT = 140
const PAD = 48

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=70'

// Design Tokens
const TYPE_CONFIG: Record<
  TripNode['category'],
  { label: string; color: string; bg: string; icon: typeof Car }
> = {
  transport: { label: 'Transport', color: '#4C8FE0', bg: 'rgba(76, 143, 224, 0.15)', icon: TrainFront },
  stay: { label: 'Hotel', color: '#8C6FE0', bg: 'rgba(140, 111, 224, 0.15)', icon: Hotel },
  food: { label: 'Eatery', color: '#E0895C', bg: 'rgba(224, 137, 92, 0.15)', icon: UtensilsCrossed },
  activity: { label: 'Activity', color: '#4FBF8C', bg: 'rgba(79, 191, 140, 0.15)', icon: Waves },
  free: { label: 'Explore', color: '#E0C24C', bg: 'rgba(224, 194, 76, 0.15)', icon: Compass },
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
  const main = nodes.filter((node) => node.status !== 'alternative')
  const days = groupDays(main)
  const placed = layout(days, branches)
  const width = Math.max(900, ...placed.map((item) => item.x + CARD_W + PAD + 140))
  const height = Math.max(540, ...placed.map((item) => item.y + CARD_H + ALT + PAD))

  if (view === 'timeline') {
    return (
      <div className="overflow-auto p-4 app-scrollbar bg-[#101823] min-h-[500px]">
        <div className="flex min-w-max items-start gap-0">
          {main.map((node, index) => (
            <div key={node.id} className="flex items-center">
              <GraphCard
                node={node}
                selected={selectedId === node.id}
                onSelect={() => onSelect(node.id)}
              />
              {index < main.length - 1 ? (
                <EdgePlus horizontal green onAdd={() => onAdd(node.id)} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative min-h-[620px] overflow-auto app-scrollbar bg-[#101823] text-[#F3EFE7]',
        view === 'map' && 'bg-[#101823]',
      )}
    >
      {/* Travel Map Grid Base */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(243, 239, 231, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative origin-top-left p-2" style={{ width, height, transform: `scale(${zoom})` }}>
        <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
          <defs>
            <marker id="tf-arrow-green" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="#3FA772" />
            </marker>
            <marker id="tf-arrow-yellow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="#E0A63A" />
            </marker>
          </defs>

          {/* Green active path connections (same-day) */}
          {days.flatMap((day) =>
            day.nodes.slice(0, -1).map((node, index) => {
              const from = placed.find((item) => item.id === node.id)
              const to = placed.find((item) => item.id === day.nodes[index + 1].id)
              if (!from || !to) return null
              return (
                <path
                  key={`${node.id}-${to.id}`}
                  d={elbow(from.x + CARD_W, from.y + CARD_H / 2, to.x, to.y + CARD_H / 2)}
                  fill="none"
                  stroke="#3FA772"
                  strokeWidth="3"
                  markerEnd="url(#tf-arrow-green)"
                />
              )
            }),
          )}

          {/* Green active path connections (Day N to Day N+1 transition) */}
          {days.slice(0, -1).map((day, index) => {
            const fromNode = day.nodes[day.nodes.length - 1]
            const toNode = days[index + 1]?.nodes[0]
            const from = fromNode && placed.find((item) => item.id === fromNode.id)
            const to = toNode && placed.find((item) => item.id === toNode.id)
            if (!from || !to) return null
            return (
              <path
                key={`${fromNode.id}-day-trans`}
                d={dayTransitionPath(from.x + CARD_W, from.y + CARD_H / 2, to.x, to.y + CARD_H / 2, width)}
                fill="none"
                stroke="#3FA772"
                strokeWidth="3"
                strokeDasharray="6 3"
                markerEnd="url(#tf-arrow-green)"
              />
            )
          })}

          {/* Yellow alternative path branch edges */}
          {branches.map((branch) => {
            const from = placed.find((item) => item.id === branch.parentId)
            const to = placed.find((item) => item.id === branch.id)
            if (!from || !to) return null
            return (
              <path
                key={branch.id}
                d={`M ${from.x + CARD_W / 2} ${from.y + CARD_H} L ${to.x + CARD_W / 2} ${to.y}`}
                fill="none"
                stroke="#E0A63A"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                markerEnd="url(#tf-arrow-yellow)"
              />
            )
          })}
        </svg>

        {/* Day Banners */}
        {days.map((day) => {
          const first = placed.find((item) => item.id === day.nodes[0]?.id)
          if (!first) return null
          return (
            <div
              key={`d-${day.day}`}
              id={`canvas-day-${day.day}`}
              className="absolute flex items-center gap-2.5"
              style={{ left: PAD, top: first.y - 28 }}
            >
              <span className="flex h-6 items-center justify-center rounded-lg bg-[#16212F] px-2.5 text-[11px] font-extrabold uppercase tracking-wider text-[#E0C24C] border border-[#E0C24C]/30 shadow-sm">
                Day {day.day}
              </span>
              <span className="text-[13px] font-bold text-[#F3EFE7]/80">
                {day.nodes[0]?.city}
              </span>
            </div>
          )
        })}

        {/* Green Current Path Nodes */}
        {placed
          .filter((item) => item.kind === 'main')
          .map((item) => {
            const node = main.find((row) => row.id === item.id)
            if (!node) return null
            return (
              <div key={item.id} className="absolute" style={{ left: item.x, top: item.y }}>
                <GraphCard node={node} selected={selectedId === node.id} onSelect={() => onSelect(node.id)} />
                <button
                  type="button"
                  aria-label="Add hop after this node"
                  onClick={() => onAdd(node.id)}
                  className="absolute -right-3.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#3FA772] bg-[#16212F] text-[#3FA772] shadow-md transition-all hover:scale-110 hover:bg-[#3FA772] hover:text-white"
                  title="Add hop here"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

        {/* Yellow Alternative Path Nodes */}
        {placed
          .filter((item) => item.kind === 'alt')
          .map((item) => {
            const branch = branches.find((row) => row.id === item.id)
            if (!branch) return null
            return (
              <div key={item.id} className="absolute" style={{ left: item.x, top: item.y }}>
                <BranchCard branch={branch} selected={selectedId === branch.id} onSelect={() => onSelectBranch(branch)} />
              </div>
            )
          })}
      </div>
    </div>
  )
}

function GraphCard({
  node,
  selected,
  onSelect,
}: {
  node: TripNode
  selected: boolean
  onSelect: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const typeCfg = TYPE_CONFIG[node.category] ?? TYPE_CONFIG.activity
  const Icon = node.category === 'transport' && node.title.toLowerCase().includes('indigo') ? Plane : typeCfg.icon

  const visited = node.status === 'visited'
  const current = node.status === 'active'
  const disrupted = node.status === 'disrupted'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-[240px] gap-2.5 rounded-xl border bg-[#16212F] p-2.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all hover:border-[#3FA772]',
        selected && 'ring-2 ring-[#3FA772] border-[#3FA772]',
        visited && 'border-[#3FA772]/60 bg-[#16212F]',
        current && 'border-[#3FA772] ring-2 ring-[#3FA772]/30 shadow-[0_0_20px_rgba(63,167,114,0.3)]',
        disrupted && 'border-[#C96A4B] bg-[#C96A4B]/10',
        !visited && !current && !disrupted && 'border-slate-800',
      )}
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#101823]">
        <img
          src={imgError ? FALLBACK_IMG : nodeImage(node)}
          onError={() => setImgError(true)}
          alt=""
          className="h-full w-full object-cover"
        />
        {/* Status Ring / Badge Overlay */}
        {visited ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[#3FA772]/85 text-white">
            <Check className="h-5 w-5" />
          </span>
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        {/* Type Header Badge */}
        <span
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
          style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}
        >
          <Icon className="h-3 w-3" />
          {typeCfg.label}
        </span>

        {/* Node Name */}
        <span className="mt-1 block truncate text-[13px] font-bold text-[#F3EFE7] group-hover:text-white">
          {node.title}
        </span>

        {/* Location / Duration */}
        <span className="block truncate text-[11px] font-medium text-slate-400">
          {node.city} · {nodeDuration(node)}
        </span>

        {/* Price & Status */}
        <span className="mt-1.5 flex items-center justify-between">
          <span className="text-[12px] font-extrabold text-[#3FA772]">
            {node.cost ? formatINR(node.cost) : 'Included'}
          </span>
          {visited ? (
            <span className="rounded-full bg-[#3FA772]/20 px-2 py-0.5 text-[9px] font-bold uppercase text-[#3FA772]">
              Visited
            </span>
          ) : current ? (
            <span className="rounded-full bg-[#3FA772] px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow-xs">
              Current
            </span>
          ) : (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400">
              Upcoming
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

function BranchCard({
  branch,
  selected,
  onSelect,
}: {
  branch: VisualBranch
  selected: boolean
  onSelect: () => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-[240px] gap-2.5 rounded-xl border border-[#E0A63A]/50 bg-[#16212F] p-2.5 text-left shadow-sm transition-all hover:border-[#E0A63A] hover:bg-[#1a2839]',
        selected && 'ring-2 ring-[#E0A63A] border-[#E0A63A]',
      )}
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#101823]">
        <img
          src={imgError ? FALLBACK_IMG : branch.image}
          onError={() => setImgError(true)}
          alt=""
          className="h-full w-full object-cover opacity-90 group-hover:opacity-100"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="inline-flex rounded-md bg-[#E0A63A]/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#E0A63A]">
          Yellow path
        </span>
        <span className="mt-1 block truncate text-[13px] font-bold text-[#F3EFE7]">{branch.title}</span>
        <span className="block truncate text-[11px] text-slate-400">{branch.subtitle}</span>
        <span
          className={cn(
            'mt-1 block text-[12px] font-extrabold',
            branch.extraCost > 0 ? 'text-[#C96A4B]' : 'text-[#3FA772]',
          )}
        >
          {branch.extraCost === 0
            ? 'Same cost'
            : `${branch.extraCost > 0 ? '+' : '−'}${formatINR(Math.abs(branch.extraCost))}`}
        </span>
      </span>
    </button>
  )
}

function EdgePlus({ horizontal, green, onAdd }: { horizontal: boolean; green: boolean; onAdd: () => void }) {
  return (
    <div className={cn('flex items-center justify-center', horizontal ? 'w-12' : 'h-8 flex-col')}>
      <span className={cn(horizontal ? 'h-0.5 w-3' : 'h-2 w-0.5', green ? 'bg-[#3FA772]' : 'bg-[#E0A63A]')} />
      <button
        type="button"
        aria-label="Add a node"
        onClick={onAdd}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-[#16212F] text-slate-400 transition-transform hover:scale-110 hover:text-white"
      >
        <Plus className="h-3 w-3" />
      </button>
      <span className={cn(horizontal ? 'h-0.5 w-3' : 'h-2 w-0.5', green ? 'bg-[#3FA772]' : 'bg-[#E0A63A]')} />
    </div>
  )
}

function layout(days: { day: number; nodes: TripNode[] }[], branches: VisualBranch[]) {
  const placed: { id: string; x: number; y: number; kind: 'main' | 'alt' }[] = []
  let y = 52
  days.forEach((day) => {
    const hasAlt = day.nodes.some((node) => branches.some((branch) => branch.parentId === node.id))
    day.nodes.forEach((node, index) => {
      const x = PAD + index * (CARD_W + COL)
      placed.push({ id: node.id, x, y, kind: 'main' })
      branches
        .filter((branch) => branch.parentId === node.id)
        .forEach((branch, altIndex) => {
          placed.push({
            id: branch.id,
            x: x + altIndex * (CARD_W + 16),
            y: y + CARD_H + 28,
            kind: 'alt',
          })
        })
    })
    y += ROW + (hasAlt ? ALT : 0)
  })
  return placed
}

function groupDays(nodes: TripNode[]) {
  const map = new Map<number, { day: number; nodes: TripNode[] }>()
  nodes.forEach((node) => {
    const current = map.get(node.day) ?? { day: node.day, nodes: [] }
    current.nodes.push(node)
    map.set(node.day, current)
  })
  return [...map.values()]
}

function elbow(x1: number, y1: number, x2: number, y2: number) {
  const midX = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
}

function dayTransitionPath(x1: number, y1: number, x2: number, y2: number, totalWidth: number) {
  if (x2 < x1) {
    const rightMargin = Math.min(totalWidth - 30, x1 + 70)
    const midY = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${rightMargin} ${y1}, ${rightMargin} ${midY}, ${rightMargin} ${y2} C ${rightMargin} ${y2}, ${x2 - 30} ${y2}, ${x2} ${y2}`
  }
  return elbow(x1, y1, x2, y2)
}
