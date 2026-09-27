import { Orbit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useWeatherTwin } from '@/hooks/useWeatherTwin'
import type { Trip } from '@/types'

export function LiveTwinBar({ trip }: { trip: Trip }) {
  const navigate = useNavigate()
  const twin = useWeatherTwin(trip)
  const snapshot = twin.snapshot
  if (!snapshot) return null

  return (
    <div className="mx-6 mt-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-[#F3EFE7]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-sky-300">
            <Orbit className="h-3.5 w-3.5" />
            Weather Digital Twin {snapshot.whatIf ? '· counterfactual' : '· live'}
          </p>
          <p className="mt-1 text-xs text-slate-200">
            {Math.round(snapshot.applied.temperatureC)}°C · {snapshot.applied.rainfallMmH.toFixed(1)} mm/h · flood{' '}
            {Math.round(snapshot.applied.floodIndex)} · feasibility {snapshot.system.feasibility}% · delay{' '}
            {snapshot.system.delayMinutes} min
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-slate-800 border-slate-700 text-slate-100"
            onClick={() => twin.patchScenario({ rainfallMmH: 12, floodIndex: 62, stormHours: 4 })}
          >
            Simulate 12 mm/h rain
          </Button>
          {snapshot.whatIf ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-slate-800 border-slate-700 text-slate-100"
              onClick={twin.resetScenario}
            >
              Reset twin
            </Button>
          ) : null}
          <Button type="button" size="sm" className="bg-sky-500 text-slate-950 hover:bg-sky-400" onClick={() => navigate(`/traveler/twin/${trip.id}`)}>
            Open twin studio
          </Button>
          <Button type="button" size="sm" className="bg-rose-400 text-slate-950 hover:bg-rose-300" onClick={() => navigate(`/traveler/predict/${trip.id}`)}>
            Emergency forecast
          </Button>
        </div>
      </div>
      {snapshot.whatIf ? (
        <p className="mt-2 text-[11px] text-sky-100">
          What-if is running on the twin only. Outdoor demand {Math.round(snapshot.system.demandShift * 100)}% · indoor restaurants{' '}
          {Math.round((snapshot.system.restaurantIndoor - 1) * 100)}% · hotel occupancy {Math.round(snapshot.system.occupancyShift * 100)}%.
        </p>
      ) : null}
    </div>
  )
}
