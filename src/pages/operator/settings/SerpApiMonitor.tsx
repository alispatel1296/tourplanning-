import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getSerpHealth, getSerpStats } from '@/services/travel/TravelDataService'
import type { SerpHealth } from '@/services/travel/types'

export function SerpApiMonitor() {
  const [health, setHealth] = useState<SerpHealth | null>(null)
  const [stats, setStats] = useState<SerpHealth['stats'] | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setBusy(true)
    const next = await getSerpHealth()
    const detail = await getSerpStats()
    setHealth(next)
    setStats(detail)
    setBusy(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const row = stats ?? health?.stats

  return (
    <div>
      <PageHeader
        title="SerpApi"
        description="Server-side search health. The API key never ships to the browser."
      />
      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="card-title">API connection</p>
          <p className="meta mt-1">{health?.provider ?? 'SerpApi'}</p>
        </div>
        <Badge tone={health?.configured ? 'success' : 'warning'}>
          {health?.configured ? 'Connected' : 'Not configured'}
        </Badge>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="meta">Requests today</p>
          <p className="mt-1 text-xl font-semibold">{row?.requestsToday ?? 0}</p>
        </Card>
        <Card>
          <p className="meta">Cached searches</p>
          <p className="mt-1 text-xl font-semibold">{row?.cachedSearches ?? 0}</p>
        </Card>
        <Card>
          <p className="meta">Errors</p>
          <p className="mt-1 text-xl font-semibold">{row?.errors ?? 0}</p>
        </Card>
        <Card>
          <p className="meta">Average latency</p>
          <p className="mt-1 text-xl font-semibold">{row?.averageLatencyMs ?? 0} ms</p>
        </Card>
      </div>
      {row?.lastRequest ? (
        <Card className="mt-4">
          <p className="card-title">Last request</p>
          <p className="mt-2 text-sm text-slate-600">
            {row.lastRequest.engine} · {row.lastRequest.query} · {row.lastRequest.resultCount} results · {row.lastRequest.cache} ·{' '}
            {row.lastRequest.latencyMs} ms
          </p>
          <p className="meta mt-1">{row.lastRequest.at}</p>
        </Card>
      ) : null}
      {row?.account ? (
        <Card className="mt-4">
          <p className="card-title">Account (official SerpApi fields only)</p>
          <p className="mt-2 text-sm text-slate-600">
            {row.account.plan ?? 'Plan unavailable'}
            {row.account.thisMonthUsage != null ? ` · ${row.account.thisMonthUsage} used` : ''}
            {row.account.searchesPerMonth != null ? ` / ${row.account.searchesPerMonth}` : ''}
          </p>
        </Card>
      ) : null}
      {row?.history?.length ? (
        <Card className="mt-4">
          <p className="card-title">Recent searches</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {row.history.map((item) => (
              <li key={`${item.at}-${item.query}`}>
                {item.engine} · {item.query}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Button type="button" className="mt-4" variant="secondary" loading={busy} onClick={() => void load()}>
        Refresh
      </Button>
    </div>
  )
}
