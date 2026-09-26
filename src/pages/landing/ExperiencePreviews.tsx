import { CloudSun, IndianRupee, MapPin, Sparkles, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/Progress'
import { StatusBadge } from '@/components/ui/Badge'
import { AILabel } from '@/components/domain/AICards'

export function TravelerPhonePreview() {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="rounded-[28px] border border-line bg-ink p-2 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
        <div className="overflow-hidden rounded-[22px] bg-surface">
          <div className="flex items-center justify-between px-5 pt-3 text-[11px] text-slate-500">
            <span>09:41</span>
            <span className="h-3 w-16 rounded-full bg-slate-200" />
            <span>5G</span>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Live trip</p>
                <p className="font-display text-lg font-semibold">West Coast Circuit</p>
              </div>
              <Badge tone="success">Day 3</Badge>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-[12px] text-slate-500">
                <span>Trip progress</span>
                <span>42%</span>
              </div>
              <ProgressBar value={42} tone="success" />
            </div>
            <Card padded={false} className="p-3">
              <p className="meta">Next destination</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-3.5 w-3.5 text-electric-600" />
                Fort Aguada · 16:45
              </p>
            </Card>
            <div className="grid grid-cols-2 gap-2">
              <Card padded={false} className="p-3">
                <p className="meta">Budget</p>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  10,340 left
                </p>
              </Card>
              <Card padded={false} className="p-3">
                <p className="meta">Weather</p>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                  <CloudSun className="h-3.5 w-3.5 text-amber-500" />
                  31° · haze
                </p>
              </Card>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <AILabel />
                <span className="text-[12px] font-semibold text-brand-800">AI alert</span>
              </div>
              <p className="text-[13px] text-slate-600">Novotel stay is waitlisted. Caravela is ready if you approve.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const tours = [
  { name: 'West Coast Circuit', load: '14/18', status: 'filling' },
  { name: 'White Desert Weekend', load: '9/24', status: 'open' },
  { name: 'Spiti Shoulder Season', load: '11/12', status: 'filling' },
]

export function OperatorDeskPreview() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Operator desk</p>
          <p className="mt-1 font-display text-lg font-semibold">Horizon Trails</p>
        </div>
        <Badge tone="ai">
          <Sparkles className="h-3 w-3" />
          Live
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Active tours" value="24" tone="info" />
        <MetricCard label="Alerts" value="6" tone="warning" icon={<TriangleAlert className="h-5 w-5" />} />
        <MetricCard label="Booked revenue" value="₹8.4L" tone="success" />
        <MetricCard label="Conflicts" value="3" tone="danger" />
      </div>
      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-3">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-900">
          <Sparkles className="h-3.5 w-3.5" />
          AI detected 3 itinerary conflicts
        </p>
        <p className="mt-1 text-[12px] text-slate-600">Novotel overbook, Baga swell, and a 12-minute rail slip.</p>
      </div>
      <div className="mt-4 space-y-2">
        {tours.map((tour) => (
          <div key={tour.name} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{tour.name}</p>
              <p className="meta">{tour.load} seats</p>
            </div>
            <StatusBadge status={tour.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
