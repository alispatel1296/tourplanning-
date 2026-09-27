import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { WeatherDrivers, WeatherWhatIf } from '@/services/twin/weatherModel'

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-brand-800">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-brand-700"
      />
    </label>
  )
}

export function WhatIfPanel({
  observed,
  scenario,
  whatIf,
  onChange,
  onReset,
}: {
  observed: WeatherDrivers
  scenario: WeatherWhatIf
  whatIf: boolean
  onChange: (patch: WeatherWhatIf) => void
  onReset: () => void
}) {
  const rainfall = scenario.rainfallMmH ?? observed.rainfallMmH
  const temperature = scenario.temperatureC ?? observed.temperatureC
  const storm = scenario.stormHours ?? observed.stormHours
  const flood = scenario.floodIndex ?? observed.floodIndex

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="card-title">What-if weather levers</p>
          <p className="meta mt-1">
            Drag a lever. The twin updates demand, capacity, delays, and the live itinerary preview — the booked system is untouched until you apply.
          </p>
        </div>
        {whatIf ? (
          <Button type="button" size="sm" variant="secondary" onClick={onReset}>
            Reset to live
          </Button>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Live weather</span>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <Slider
          label="Rainfall intensity"
          value={Number(rainfall.toFixed(1))}
          min={0}
          max={25}
          step={0.5}
          suffix=" mm/h"
          onChange={(rainfallMmH) => onChange({ rainfallMmH })}
        />
        <Slider
          label="Temperature"
          value={Math.round(temperature)}
          min={16}
          max={44}
          step={1}
          suffix="°C"
          onChange={(temperatureC) => onChange({ temperatureC })}
        />
        <Slider
          label="Storm duration"
          value={Math.round(storm)}
          min={0}
          max={18}
          step={1}
          suffix=" h"
          onChange={(stormHours) => onChange({ stormHours })}
        />
        <Slider
          label="Flooding index"
          value={Math.round(flood)}
          min={0}
          max={100}
          step={1}
          suffix=""
          onChange={(floodIndex) => onChange({ floodIndex })}
        />
      </div>
    </Card>
  )
}
