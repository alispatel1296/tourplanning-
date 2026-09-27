import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { testAll, testConnection, type HealthRow } from '@/services/health'
import type { ServiceId } from '@/services/env'
import { getSerpHealth } from '@/services/travel/TravelDataService'
import { NugenPipeline } from '@/pages/traveler/twin/NugenPipeline'
import { useNavigate } from 'react-router-dom'

const LABELS: Record<string, string> = {
  maps: 'Maps',
  weather: 'Weather',
  places: 'Places',
  ai: 'AI',
  currency: 'Currency',
}

export function OperatorIntegrations() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<HealthRow[]>([])
  const [busy, setBusy] = useState<string | null>('all')
  const [serp, setSerp] = useState<{ configured: boolean; latency?: number; detail: string } | null>(null)

  const load = async () => {
    setBusy('all')
    const next = await testAll()
    setRows(next)
    try {
      const started = performance.now()
      const health = await getSerpHealth()
      setSerp({
        configured: health.configured,
        latency: Math.round(performance.now() - started),
        detail: health.configured
          ? `SerpApi reachable · ${health.stats.requestsToday} requests today`
          : 'Not configured · set SERPAPI_API_KEY on the server',
      })
    } catch {
      setSerp({ configured: false, detail: 'Live search is temporarily unavailable.' })
    }
    setBusy(null)
  }

  useEffect(() => {
    void load()
  }, [])

  const ping = async (id: ServiceId) => {
    setBusy(id)
    const row = await testConnection(id)
    setRows((current) => current.map((item) => (item.id === id ? row : item)))
    setBusy(null)
  }

  return (
    <div>
      <PageHeader
        title="Integrations Health"
        description="Live service health for maps, weather, places, AI, and currency. Public APIs work out of the box with optional production key overrides."
      />

      <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-950">Market-Ready Zero-Config Stack Active</p>
            <p className="mt-1 text-[13px] text-slate-600">
              TripFlow AI automatically uses OpenStreetMap, Open-Meteo weather, Nominatim places, and Open ER-API currency without requiring mandatory API keys. Optional SerpApi and OpenAI keys upgrade to live Google search & AI ranking.
            </p>
          </div>
          <Badge tone="success">Zero-Key Fallbacks Ready</Badge>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="card-title">{LABELS[row.id] ?? row.label}</p>
              <p className="meta mt-1">{row.provider}</p>
              <p className="mt-1 text-sm text-slate-600">{row.detail}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                tone={
                  row.status === 'connected' ? 'success' : row.status === 'not_configured' ? 'warning' : 'danger'
                }
              >
                {row.status === 'connected'
                  ? 'Connected'
                  : row.status === 'not_configured'
                    ? 'Not configured'
                    : 'Error'}
              </Badge>
              {row.latencyMs != null ? <span className="meta">{row.latencyMs} ms</span> : null}
              <Button type="button" size="sm" variant="secondary" loading={busy === row.id} onClick={() => ping(row.id)}>
                Test Connection
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-3">
        <NugenPipeline />
      </div>

      <Card className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="card-title">SerpApi</p>
          <p className="meta mt-1">Travel data layer · server-only key</p>
          <p className="mt-1 text-sm text-slate-600">{serp?.detail ?? 'Not tested yet'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={serp?.configured ? 'success' : 'warning'}>{serp?.configured ? 'Connected' : 'Not configured'}</Badge>
          {serp?.latency != null ? <span className="meta">{serp.latency} ms</span> : null}
          <Button type="button" size="sm" variant="secondary" onClick={() => navigate('/operator/settings/integrations/serpapi')}>
            Open monitor
          </Button>
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" loading={busy === 'all'} onClick={() => void load()}>
          Retest all services
        </Button>
      </div>
    </div>
  )
}
