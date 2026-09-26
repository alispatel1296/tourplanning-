import { TrainFront, Hotel, UtensilsCrossed, Waves, Bike } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { AILabel } from '@/components/domain/AICards'
import { cn } from '@/lib/cn'

const nodes = [
  { city: 'Ahmedabad', stay: 'Depart 06:10', items: [{ icon: TrainFront, label: 'Vande Bharat', tone: 'active' as const }] },
  {
    city: 'Mumbai',
    stay: '2 nights · Fern',
    items: [
      { icon: Hotel, label: 'Hotel', tone: 'active' as const },
      { icon: UtensilsCrossed, label: 'Trishna', tone: 'active' as const },
    ],
  },
  {
    city: 'Goa',
    stay: '4 nights · Candolim',
    items: [
      { icon: Waves, label: 'Beach', tone: 'active' as const },
      { icon: Bike, label: 'Activity', tone: 'active' as const },
    ],
  },
]

export function HeroEngine() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Itinerary engine</p>
          <p className="mt-1 text-sm font-semibold text-ink">West Coast Circuit</p>
        </div>
        <Badge tone="success">Active route</Badge>
      </div>

      <div className="relative sm:pr-[210px]">
        {nodes.map((node, index) => (
          <div key={node.city} className="relative grid grid-cols-[18px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-600 bg-emerald-50" />
              {index < nodes.length - 1 ? <span className="w-px flex-1 bg-emerald-500" /> : <span className="h-0" />}
            </div>
            <div className={cn('min-w-0', index < nodes.length - 1 && 'pb-5')}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-[17px] font-semibold">{node.city}</p>
                <p className="meta">{node.stay}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {node.items.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700"
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                ))}
                {node.city === 'Ahmedabad' ? (
                  <span className="inline-flex items-center rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-700">
                    Alt · Flight
                  </span>
                ) : null}
                {node.city === 'Goa' ? (
                  <span className="inline-flex items-center rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-700">
                    Alt · Caravela
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-16 right-4 hidden w-[200px] rounded-xl border border-brand-100 bg-white/95 p-3 shadow-lg ai-glow sm:block">
        <div className="mb-2 flex items-center justify-between">
          <AILabel />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">Optimization</span>
        </div>
        <p className="text-[13px] font-semibold text-ink">Saved ₹4,200</p>
        <p className="mt-1.5 text-[12px] text-slate-600">Removed 1 timing conflict</p>
        <p className="mt-1 text-[12px] text-slate-600">Added 45 min safety buffer</p>
      </div>

      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/80 p-3 sm:hidden">
        <div className="mb-1.5 flex items-center gap-2">
          <AILabel />
          <span className="text-[12px] font-semibold text-brand-800">AI Optimization</span>
        </div>
        <p className="text-[13px] text-slate-600">Saved ₹4,200 · removed 1 timing conflict · added 45 min safety buffer</p>
      </div>
    </div>
  )
}
