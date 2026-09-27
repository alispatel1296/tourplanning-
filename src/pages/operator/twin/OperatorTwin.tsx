import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Orbit } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { WeatherTwinMap } from '@/components/domain/WeatherTwinMap'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, MetricCard } from '@/components/ui/Card'
import { useWeatherTwin } from '@/hooks/useWeatherTwin'
import { usePrimaryTrip } from '@/state/AppState'
import { NugenPipeline } from '@/pages/traveler/twin/NugenPipeline'
import { WhatIfPanel } from '@/pages/traveler/twin/WhatIfPanel'

export function OperatorTwin() {
  const trip = usePrimaryTrip()
  const navigate = useNavigate()
  const twin = useWeatherTwin(trip)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const snapshot = twin.snapshot
  const stressed = useMemo(
    () => snapshot?.entities.filter((item) => item.status === 'stressed' || item.status === 'disrupted') ?? [],
    [snapshot],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations Digital Twin"
        title="Weather pressure across the live circuit"
        description="The same twin that drives Aarav’s companion — live Open-Meteo, SerpApi social corroboration, and what-if levers for the desk."
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate(`/traveler/twin/${trip.id}`)}>
            Open traveler twin
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Desk feasibility" value={snapshot ? `${snapshot.system.feasibility}%` : '…'} tone="ai" icon={<Orbit className="h-5 w-5" />} />
        <MetricCard
          label="Nodes under weather"
          value={String(stressed.length)}
          hint="Stressed or disrupted"
          tone={stressed.length ? 'warning' : 'success'}
        />
        <MetricCard
          label="Social weight"
          value={snapshot ? `${Math.round((snapshot.socialWeight ?? 0) * 100)}%` : '…'}
          hint={twin.socialConfigured ? 'SerpApi news + search' : 'SerpApi not configured'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
        <WeatherTwinMap
          title="Corridor impact map"
          nodes={twin.located}
          entities={snapshot?.entities ?? []}
          cities={snapshot?.cities ?? []}
          links={snapshot?.links ?? []}
          selectedId={selectedId}
          onSelect={setSelectedId}
          height={420}
          caption="Weather cells, cascade edges, and live itinerary nodes"
        />
        <div className="space-y-4">
          {snapshot ? (
            <WhatIfPanel
              observed={snapshot.observed}
              scenario={twin.scenario}
              whatIf={snapshot.whatIf}
              onChange={twin.patchScenario}
              onReset={twin.resetScenario}
            />
          ) : null}
          <NugenPipeline aiMeta={twin.aiMeta} />
          <Card>
            <p className="card-title">Desk narrative</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{twin.narrative ?? snapshot?.narrative}</p>
            <div className="mt-3 space-y-2">
              {stressed.map((item) => (
                <button
                  key={item.nodeId}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left"
                  onClick={() => setSelectedId(item.nodeId)}
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <Badge tone={item.status === 'disrupted' ? 'danger' : 'warning'}>{item.status}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
