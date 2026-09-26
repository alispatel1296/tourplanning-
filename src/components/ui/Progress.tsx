import { cn } from '@/lib/cn'

export function ProgressBar({
  value,
  tone = 'success',
}: {
  value: number
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'ai'
}) {
  const colors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-electric-500',
    ai: 'bg-brand-500',
  }

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn('h-full rounded-full transition-all', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  label,
  size = 72,
}: {
  value: number
  label?: string
  size?: number
}) {
  const stroke = 6
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ
  const tone = value >= 80 ? '#059669' : value >= 60 ? '#d97706' : '#e11d48'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e6e8ee" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-sm font-semibold">{value}%</p>
        {label ? <p className="text-[10px] text-slate-400">{label}</p> : null}
      </div>
    </div>
  )
}
