import type { ReactNode } from 'react'
import { Activity, BrainCircuit, Clock, ShieldAlert, Waypoints } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { cn, formatINR } from '@/lib/cn'
import type { EmergencyForecast, EmergencyLevel } from '@/services/predict/emergencyModel'

const TONE: Record<EmergencyLevel, { badge: 'success' | 'warning' | 'danger' | 'info'; bar: string; label: string }> = {
  clear: { badge: 'success', bar: 'bg-emerald-500', label: 'Clear' },
  watch: { badge: 'info', bar: 'bg-sky-500', label: 'Watch' },
  warning: { badge: 'warning', bar: 'bg-amber-500', label: 'Warning' },
  critical: { badge: 'danger', bar: 'bg-rose-500', label: 'Critical' },
}

export function EmergencyPredictPanel({
  forecast,
  compact = false,
}: {
  forecast: EmergencyForecast
  compact?: boolean
}) {
  const tone = TONE[forecast.level]
  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <Card className={cn(forecast.level === 'critical' && 'border-rose-200 bg-rose-50/50', forecast.level === 'warning' && 'border-amber-200 bg-amber-50/40')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted-gold)]">USP · Predictive emergency</p>
            <h2 className="mt-1 font-display text-2xl text-ink">Emergency forecast</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{forecast.headline}</p>
          </div>
          <Badge tone={tone.badge}>{tone.label}</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={<ShieldAlert className="h-4 w-4" />} label="P(emergency)" value={`${Math.round(forecast.pEmergency * 100)}%`} hint={`${forecast.triggerCity} · ${forecast.triggerTitle}`} />
          <Stat icon={<Clock className="h-4 w-4" />} label="Lead time" value={formatLead(forecast.leadMinutes)} hint="Until the stressed hop" />
          <Stat icon={<Waypoints className="h-4 w-4" />} label="Cascade" value={`${forecast.cascadeMinutes} min`} hint={`${Math.round(forecast.pDelay * 100)}% delay risk`} />
          <Stat icon={<Activity className="h-4 w-4" />} label="Confidence" value={`${Math.round(forecast.confidence * 100)}%`} hint={`±${Math.round(forecast.uncertainty * 100)} pts · ~${formatINR(forecast.expectedCost)} if staged`} />
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={cn('h-full rounded-full transition-all', tone.bar)} style={{ width: `${Math.round(forecast.pEmergency * 100)}%` }} />
          </div>
        </div>
      </Card>

      {compact ? null : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {forecast.frameworks.map((item) => (
            <Card key={item.id} className="h-full">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.family}</p>
              <p className="mt-1 font-display text-lg text-ink">{item.name}</p>
              <p className="mt-2 text-sm font-semibold text-brand-800">{item.value}</p>
              <p className="mt-1 text-[13px] text-slate-600">{item.reading}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{item.detail}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <p className="flex items-center gap-2 card-title">
          <BrainCircuit className="h-4 w-4 text-brand-700" />
          Playbook if the score rises
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          {forecast.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

function formatLead(minutes: number) {
  if (minutes >= 180) return `${Math.round(minutes / 60)} h`
  return `${minutes} min`
}

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white/80 px-3 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
      <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-500">{hint}</p>
    </div>
  )
}
