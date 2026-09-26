import { getJson } from '@/services/http'
import { env, isConfigured, providerLabel, type ServiceId } from '@/services/env'
import { cacheGet, cacheSet, TTL } from '@/services/cache'

export interface HealthRow {
  id: ServiceId
  label: string
  provider: string
  status: 'connected' | 'not_configured' | 'error'
  latencyMs?: number
  detail: string
}

async function pingJson(url: string): Promise<number> {
  const { latencyMs } = await getJson<unknown>(url, { timeoutMs: 8000 })
  return latencyMs
}

async function pingOk(url: string): Promise<number> {
  const started = performance.now()
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('bad')
    return Math.round(performance.now() - started)
  } finally {
    window.clearTimeout(timer)
  }
}

export async function testConnection(id: ServiceId): Promise<HealthRow> {
  const key = `health:${id}`
  const cached = cacheGet<HealthRow>(key)
  if (cached) return cached
  const base: HealthRow = {
    id,
    label: id[0].toUpperCase() + id.slice(1),
    provider: providerLabel(id),
    status: 'connected',
    detail: 'Ready',
  }
  try {
    if (id === 'maps') {
      const latencyMs = await pingOk('https://tile.openstreetmap.org/0/0/0.png')
      Object.assign(base, { latencyMs, detail: 'OSM tiles reachable' })
    } else if (id === 'geocode') {
      const latencyMs = await pingJson('https://nominatim.openstreetmap.org/status.php?format=json')
      Object.assign(base, { latencyMs, detail: 'Nominatim reachable' })
    } else if (id === 'routing') {
      const latencyMs = await pingJson(
        'https://router.project-osrm.org/route/v1/driving/72.5714,23.0225;72.8777,19.076?overview=false',
      )
      Object.assign(base, { latencyMs, detail: 'OSRM reachable' })
    } else if (id === 'places' || id === 'hotels') {
      const latencyMs = await pingJson('https://nominatim.openstreetmap.org/status.php?format=json')
      Object.assign(base, { latencyMs, detail: 'Place search reachable · hotel booking is demo' })
    } else if (id === 'weather') {
      const latencyMs = await pingJson('https://api.open-meteo.com/v1/forecast?latitude=15.49&longitude=73.83&current=temperature_2m')
      Object.assign(base, { latencyMs, detail: 'Open-Meteo reachable' })
    } else if (id === 'currency') {
      const latencyMs = await pingJson('https://open.er-api.com/v6/latest/INR')
      Object.assign(base, { latencyMs, detail: 'Open ER-API reachable (INR included)' })
    } else if (id === 'ai') {
      if (!env.aiKey) {
        Object.assign(base, { status: 'not_configured' as const, detail: 'Local ranker only · set VITE_AI_API_KEY for LLM' })
      } else {
        Object.assign(base, { status: 'connected' as const, detail: 'OpenAI key present — keep secrets on a backend in production' })
      }
    }
  } catch {
    if (!isConfigured(id)) {
      Object.assign(base, { status: 'not_configured' as const, detail: 'Not configured' })
    } else {
      Object.assign(base, { status: 'error' as const, detail: 'We could not reach this service right now.' })
    }
  }
  cacheSet(key, base, TTL.health)
  return base
}

export async function testAll(): Promise<HealthRow[]> {
  const ids: ServiceId[] = ['maps', 'weather', 'places', 'ai', 'currency']
  const rows: HealthRow[] = []
  for (const id of ids) rows.push(await testConnection(id))
  return rows
}
