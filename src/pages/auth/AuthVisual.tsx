import { Sparkles } from 'lucide-react'
import { Brand } from '@/components/layout/Brand'

const cities = ['Ahmedabad', 'Mumbai', 'Goa']

export function AuthVisual() {
  return (
    <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-navy px-10 py-10 text-white lg:flex lg:w-[45%]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-10%] h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-20%] h-80 w-80 rounded-full bg-electric-600/10 blur-3xl" />
      </div>
      <Brand tone="dark" />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live itinerary</p>
        <div className="mt-6">
          {cities.map((city, index) => (
            <div key={city} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-3 w-3 rounded-full border-2 border-emerald-400 bg-emerald-500/20" />
                {index < cities.length - 1 ? <span className="w-px flex-1 bg-emerald-500/70" /> : null}
              </div>
              <div className={index < cities.length - 1 ? 'pb-8' : ''}>
                <p className="font-display text-xl font-semibold">{city}</p>
                <p className="mt-1 text-[13px] text-slate-400">
                  {index === 0 ? 'Train · 06:10' : index === 1 ? 'Stay + food' : 'Beach + activity'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="ai-generating mt-8 max-w-sm rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-medium text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            Optimizing your journey...
          </p>
        </div>
      </div>

      <p className="relative font-display text-2xl font-semibold leading-snug tracking-tight">
        Travel plans that adapt to reality.
      </p>
    </aside>
  )
}
