import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Overlay'
import { formatINR } from '@/lib/cn'
import type { NodeAlternative } from '@/pages/traveler/flow/alternatives'

export interface CompareSide {
  name: string
  price: number
  duration: string
  distance: string
  rating: number
  convenience: string
  feasibility: string
}

const rows: { key: keyof Omit<CompareSide, 'name'>; label: string }[] = [
  { key: 'price', label: 'Price' },
  { key: 'duration', label: 'Duration' },
  { key: 'distance', label: 'Distance' },
  { key: 'rating', label: 'Rating' },
  { key: 'convenience', label: 'Convenience' },
  { key: 'feasibility', label: 'Feasibility' },
]

export function Comparison({
  open,
  current,
  alternative,
  onClose,
  onKeep,
  onChoose,
}: {
  open: boolean
  current: CompareSide | null
  alternative: NodeAlternative | null
  onClose: () => void
  onKeep: () => void
  onChoose: (alt: NodeAlternative) => void
}) {
  if (!current || !alternative) return null

  const altSide: CompareSide = {
    name: alternative.name,
    price: alternative.price,
    duration: alternative.duration,
    distance: alternative.distance,
    rating: alternative.rating,
    convenience: alternative.convenience,
    feasibility: alternative.feasibility,
  }

  return (
    <Modal open={open} onClose={onClose} title="Compare options" wide>
      <p className="text-sm text-slate-600">
        Side-by-side facts only. TripFlow will not pick a winner — you choose the live node.
      </p>
      <DeltaBanner current={current} alternative={altSide} />
      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[7rem_1fr_1fr] bg-slate-50 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          <p className="px-3 py-2.5"> </p>
          <p className="px-3 py-2.5">Current</p>
          <p className="px-3 py-2.5">Alternative</p>
        </div>
        <div className="grid grid-cols-[7rem_1fr_1fr] border-t border-line text-sm">
          <p className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Name</p>
          <p className="px-3 py-2.5 font-medium">{current.name}</p>
          <p className="px-3 py-2.5 font-medium">{altSide.name}</p>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[7rem_1fr_1fr] border-t border-line text-sm">
            <p className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {row.label}
            </p>
            <p className="px-3 py-2.5">{formatValue(row.key, current[row.key])}</p>
            <p className="px-3 py-2.5">{formatValue(row.key, altSide[row.key])}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onKeep}>
          Keep current
        </Button>
        <Button type="button" onClick={() => onChoose(alternative)}>Use alternative</Button>
      </div>
    </Modal>
  )
}

function formatValue(key: keyof Omit<CompareSide, 'name'>, value: string | number) {
  if (key === 'price') return formatINR(Number(value))
  if (key === 'rating') return `${Number(value).toFixed(1)} ★`
  return String(value)
}

function minutesFrom(value: string) {
  const range = value.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
  if (range) {
    const start = Number(range[1]) * 60 + Number(range[2])
    const end = Number(range[3]) * 60 + Number(range[4])
    return end >= start ? end - start : end + 24 * 60 - start
  }
  const hours = value.match(/(\d+(?:\.\d+)?)\s*h/)
  const mins = value.match(/(\d+)\s*m/)
  if (hours || mins) return Math.round((hours ? Number(hours[1]) : 0) * 60 + (mins ? Number(mins[1]) : 0))
  const onlyHours = value.match(/(\d+)\s*hours?/i)
  if (onlyHours) return Number(onlyHours[1]) * 60
  return null
}

function DeltaBanner({ current, alternative }: { current: CompareSide; alternative: CompareSide }) {
  const cost = alternative.price - current.price
  const currentMin = minutesFrom(current.duration)
  const altMin = minutesFrom(alternative.duration)
  const time = currentMin != null && altMin != null ? altMin - currentMin : null
  const feasibility = alternative.feasibility !== current.feasibility

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3" role="status" aria-live="polite">
      <Delta
        label="Cost delta"
        value={cost === 0 ? 'No change' : `${cost > 0 ? '+' : '−'}${formatINR(Math.abs(cost))}`}
        tone={cost > 0 ? 'danger' : cost < 0 ? 'success' : 'default'}
      />
      <Delta
        label="Time delta"
        value={
          time == null
            ? `${current.duration} → ${alternative.duration}`
            : time === 0
              ? 'No change'
              : `${time > 0 ? '+' : '−'}${formatDuration(Math.abs(time))}`
        }
        tone={time != null && time > 0 ? 'warning' : time != null && time < 0 ? 'success' : 'default'}
      />
      <Delta
        label="Feasibility"
        value={feasibility ? `${current.feasibility} → ${alternative.feasibility}` : alternative.feasibility}
        tone={feasibility ? 'ai' : 'default'}
      />
    </div>
  )
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours && rest) return `${hours}h ${rest}m`
  if (hours) return `${hours}h`
  return `${rest}m`
}

function Delta({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' | 'ai' | 'default' }) {
  const colors = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
    ai: 'border-brand-200 bg-brand-50 text-brand-800',
    default: 'border-line bg-slate-50 text-slate-700',
  }
  return (
    <div className={`rounded-xl border px-3 py-2 ${colors[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
