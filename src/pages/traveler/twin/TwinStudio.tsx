import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloudRain, Orbit, Radio, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { WeatherTwinMap } from '@/components/domain/WeatherTwinMap'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, MetricCard } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { useWeatherTwin } from '@/hooks/useWeatherTwin'
import { cn, formatINR } from '@/lib/cn'
import { EmergencyPredictPanel } from '@/pages/traveler/predict/EmergencyPredictPanel'
import { forecastEmergency } from '@/services/predict/emergencyModel'
import { NugenPipeline } from '@/pages/traveler/twin/NugenPipeline'
import { WhatIfPanel } from '@/pages/traveler/twin/WhatIfPanel'
import { projectedNodes } from '@/services/twin/weatherModel'
import { useAppState } from '@/state/AppState'

const TONE: Record<string, string> = {
  stable: 'bg-emerald-50 text-emerald-800',
  watch: 'bg-amber-50 text-amber-800',
  stressed: 'bg-orange-50 text-orange-800',
  disrupted: 'bg-rose-50 text-rose-800',
}

export function TwinStudio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trips, applyLiveReroute, pushToast } = useAppState()
  const trip = trips.find((item) => item.id === id) ?? trips[0]
  const twin = useWeatherTwin(trip)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const snapshot = twin.snapshot
  const selected = snapshot?.entities.find((item) => item.nodeId === selectedId) ?? snapshot?.entities.find((item) => item.status !== 'stable')
  const preview = useMemo(
    () => (trip && snapshot ? projectedNodes(trip.nodes, snapshot) : trip?.nodes ?? []),
    [trip, snapshot],
  )
  const outdoorHit = snapshot?.entities.find((item) => item.outdoor && (item.status === 'disrupted' || item.status === 'stressed'))

  if (!trip) {
    return (
      <EmptyState
        icon={<Orbit className="h-5 w-5" />}
        title="No circuit to twin"
        body="Open a trip first, then run the weather Digital Twin on that itinerary."
        action={<Button onClick={() => navigate('/traveler/trips')}>My trips</Button>}
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Weather Digital Twin"
        title={`${trip.title} · live + counterfactual`}
        description="Open-Meteo observations, SerpApi social signals, and the existing itinerary graph stay in one model. What-if levers change the twin only."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={twin.refresh}>
              Refresh live feeds
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/traveler/live/${trip.id}`)}>
              Open live companion
            </Button>
          </div>
        }
      />

      {twin.error ? <p className="text-sm text-amber-800">{twin.error}</p> : null}

      {snapshot ? <EmergencyPredictPanel forecast={forecastEmergency(trip, snapshot)} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Twin feasibility"
          value={snapshot ? `${snapshot.system.feasibility}%` : '…'}
          hint={snapshot?.system.feasibilityLabel ?? 'Loading weather'}
          icon={<Orbit className="h-5 w-5 text-brand-600" />}
          tone={snapshot && snapshot.system.feasibility < 70 ? 'danger' : 'ai'}
        />
        <MetricCard
          label="Live weather"
          value={snapshot ? `${Math.round(snapshot.applied.temperatureC)}°C` : '…'}
          hint={
            snapshot
              ? `${snapshot.applied.rainfallMmH.toFixed(1)} mm/h · flood ${Math.round(snapshot.applied.floodIndex)}`
              : 'Open-Meteo'
          }
          icon={<CloudRain className="h-5 w-5 text-sky-600" />}
          tone="info"
        />
        <MetricCard
          label="Cascade delay"
          value={snapshot ? `${snapshot.system.delayMinutes} min` : '…'}
          hint="Transport + outdoor buffers"
          tone={snapshot && snapshot.system.delayMinutes >= 20 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Prediction confidence"
          value={snapshot ? `${Math.round(snapshot.system.confidence * 100)}%` : '…'}
          hint={`Uncertainty ±${snapshot ? Math.round(snapshot.system.uncertainty * 100) : 0} pts`}
          tone="success"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="space-y-4">
          <WeatherTwinMap
            nodes={twin.located}
            entities={snapshot?.entities ?? []}
            cities={snapshot?.cities ?? []}
            links={snapshot?.links ?? []}
            selectedId={selected?.nodeId}
            onSelect={setSelectedId}
            height={400}
            caption={`${twin.focusCity} weather cell · ${snapshot?.links.length ?? 0} cascade edges`}
          />

          <Card>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="card-title">Existing itinerary under this weather</p>
                <p className="meta">Projected status only — bookings stay unchanged until you apply.</p>
              </div>
              <Badge tone={snapshot?.whatIf ? 'warning' : 'success'}>{snapshot?.whatIf ? 'Counterfactual' : 'Observed'}</Badge>
            </div>
            <div className="mt-3 divide-y divide-line">
              {preview.map((node) => {
                const impact = snapshot?.entities.find((item) => item.nodeId === node.id)
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className="flex w-full items-start justify-between gap-3 py-2.5 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{node.title}</p>
                      <p className="meta truncate">
                        {node.city} · {node.time}
                        {impact ? ` · delay ${impact.delayMinutes} min · demand ${Math.round(impact.demandDelta * 100)}%` : ''}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', TONE[impact?.status ?? node.status] ?? 'bg-slate-100')}>
                      {impact?.status ?? node.status}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {snapshot ? (
            <WhatIfPanel
              observed={snapshot.observed}
              scenario={twin.scenario}
              whatIf={snapshot.whatIf}
              onChange={twin.patchScenario}
              onReset={twin.resetScenario}
            />
          ) : (
            <Card>Loading weather twin…</Card>
          )}

          <NugenPipeline aiMeta={twin.aiMeta} />

          <Card>
            <p className="card-title">System deltas</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              <Delta label="Outdoor demand" value={snapshot?.system.demandShift} />
              <Delta label="Hotel occupancy" value={snapshot?.system.occupancyShift} />
              <Delta label="Indoor restaurants" value={snapshot ? snapshot.system.restaurantIndoor - 1 : undefined} />
              <Delta label="Attraction capacity" value={snapshot ? snapshot.system.attractionCapacity - 1 : undefined} />
              <Delta label="Outdoor workforce" value={snapshot ? snapshot.system.workforceOutdoor - 1 : undefined} />
              <Delta label="Transport reliability" value={snapshot ? snapshot.system.transportReliability - 1 : undefined} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{twin.narrative ?? snapshot?.narrative}</p>
            {twin.aiMeta?.source === 'nugen' ? (
              <p className="meta mt-2">
                Nugen {twin.aiMeta.stage} · {twin.aiMeta.model}
                {twin.aiMeta.confidence != null ? ` · confidence ${Math.round(twin.aiMeta.confidence)}` : ''}
              </p>
            ) : null}
          </Card>

          <Card>
            <p className="card-title">Selected node</p>
            {selected ? (
              <div className="mt-2 space-y-2 text-[13px] text-slate-700">
                <p className="font-semibold text-ink">{selected.title}</p>
                <p className="meta">
                  P(disrupt) {Math.round(selected.pDisrupt * 100)}% · P(delay) {Math.round(selected.pDelay * 100)}% · ±
                  {Math.round(selected.uncertainty * 100)} pts
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  {selected.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="meta mt-2">Select a node on the map or list.</p>
            )}
          </Card>

          <Card className="border-amber-200 bg-amber-50/70">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-700" />
              <div>
                <p className="card-title">Apply to the live companion</p>
                <p className="meta mt-1">
                  {outdoorHit
                    ? `${outdoorHit.title} is ${outdoorHit.status}. Staging uses the existing rain-reroute path — indoor food replaces the outdoor slot.`
                    : 'Raise rainfall or flood until an outdoor node turns stressed, then apply.'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="mt-3"
              disabled={!outdoorHit}
              icon={<Radio className="h-4 w-4" />}
              onClick={() => {
                if (!outdoorHit) return
                applyLiveReroute(trip.id, outdoorHit.nodeId, 'stage')
                pushToast({
                  title: 'Twin applied to live trip',
                  body: `${outdoorHit.title} is staged as disrupted. Indoor alternative is yellow until you accept.`,
                })
                navigate(`/traveler/live/${trip.id}`)
              }}
            >
              Stage live reroute from twin
            </Button>
            <p className="mt-2 text-[12px] text-slate-500">
              Remaining budget {formatINR(Math.max(0, trip.budget - trip.spent))} stays on the booked file until accept.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <p className="card-title">SerpApi social signals</p>
              <Badge tone={twin.socialConfigured ? 'success' : 'warning'}>
                {twin.socialConfigured ? 'Live' : 'Not configured'}
              </Badge>
            </div>
            {twin.socialMessage ? <p className="meta mt-1">{twin.socialMessage}</p> : null}
            <div className="mt-3 space-y-3">
              {(twin.signals.length ? twin.signals : []).slice(0, 6).map((signal) => (
                <a
                  key={signal.id}
                  href={signal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-line px-3 py-2 hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-ink">{signal.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-600">{signal.snippet}</p>
                  <p className="meta mt-1">
                    {signal.city} · {signal.source.replace('_', ' ')} · {signal.topics.join(', ') || 'public signal'} · sentiment{' '}
                    {signal.sentiment > 0 ? '+' : ''}
                    {signal.sentiment}
                  </p>
                </a>
              ))}
              {!twin.signals.length ? (
                <p className="meta">Waiting on Google News / search via SerpApi for {twin.focusCity} weather reactions.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Delta({ label, value }: { label: string; value?: number }) {
  const pct = value == null ? '…' : `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-0.5 font-semibold', (value ?? 0) < 0 ? 'text-rose-700' : 'text-emerald-700')}>{pct}</p>
    </div>
  )
}
