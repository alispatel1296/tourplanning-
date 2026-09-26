import { createHash } from 'node:crypto'
import type { SerpStats } from './types'

const SERPAPI = 'https://serpapi.com/search.json'
const ACCOUNT = 'https://serpapi.com/account.json'

type CacheEntry = { value: unknown; expires: number }

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<SerpCallResult>>()
let lastCallAt = 0
const MIN_GAP_MS = 350

const stats = {
  requests: [] as Array<{ engine: string; query: string; at: string; latencyMs: number; resultCount: number; cache: string; error?: string }>,
  errors: 0,
}

export interface SerpCallResult {
  data: Record<string, unknown>
  latencyMs: number
  cache: 'hit' | 'miss'
  engine: string
  query: string
  resultCount: number
}

export function getSerpKey(): string {
  return (process.env.SERPAPI_API_KEY ?? '').trim()
}

export function isSerpConfigured(): boolean {
  return Boolean(getSerpKey())
}

function cacheKey(engine: string, params: Record<string, string>): string {
  const copy = { ...params }
  delete copy.api_key
  return createHash('sha1').update(`${engine}:${JSON.stringify(copy)}`).digest('hex')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function throttle() {
  const wait = MIN_GAP_MS - (Date.now() - lastCallAt)
  if (wait > 0) await sleep(wait)
  lastCallAt = Date.now()
}

function countResults(data: Record<string, unknown>): number {
  const keys = ['properties', 'local_results', 'best_flights', 'other_flights', 'organic_results', 'events_results', 'images_results', 'news_results', 'shopping_results', 'reviews', 'destinations']
  return keys.reduce((sum, key) => {
    const value = data[key]
    return sum + (Array.isArray(value) ? value.length : 0)
  }, 0)
}

function record(entry: (typeof stats.requests)[number]) {
  stats.requests.unshift(entry)
  stats.requests.splice(80)
  if (entry.error) stats.errors += 1
}

export async function serpApiSearch(engine: string, params: Record<string, string | number | undefined>): Promise<SerpCallResult> {
  const key = getSerpKey()
  if (!key) {
    const error = new Error('SERPAPI_NOT_CONFIGURED')
    throw error
  }

  const clean: Record<string, string> = { engine, api_key: key }
  for (const [name, value] of Object.entries(params)) {
    if (value == null || value === '') continue
    clean[name] = String(value)
  }

  const id = cacheKey(engine, clean)
  const cached = cache.get(id)
  if (cached && cached.expires > Date.now()) {
    const data = cached.value as Record<string, unknown>
    const hit: SerpCallResult = {
      data,
      latencyMs: 0,
      cache: 'hit',
      engine,
      query: clean.q ?? clean.departure_id ?? engine,
      resultCount: countResults(data),
    }
    record({
      engine,
      query: hit.query,
      at: new Date().toISOString(),
      latencyMs: 0,
      resultCount: hit.resultCount,
      cache: 'hit',
    })
    return hit
  }

  const pending = inflight.get(id)
  if (pending) return pending

  const run = (async () => {
    let lastError: unknown
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await throttle()
      const started = Date.now()
      const url = `${SERPAPI}?${new URLSearchParams(clean).toString()}`
      try {
        const response = await fetch(url, { headers: { Accept: 'application/json' } })
        const latencyMs = Date.now() - started
        if (response.status === 429) {
          lastError = new Error('RATE_LIMIT')
          await sleep(600 * 2 ** attempt)
          continue
        }
        if (!response.ok) {
          lastError = new Error(`SERPAPI_${response.status}`)
          if (response.status >= 500) {
            await sleep(400 * 2 ** attempt)
            continue
          }
          break
        }
        const data = (await response.json()) as Record<string, unknown>
        if (data.error) {
          lastError = new Error(String(data.error))
          break
        }
        cache.set(id, { value: data, expires: Date.now() + 30 * 60 * 1000 })
        const result: SerpCallResult = {
          data,
          latencyMs,
          cache: 'miss',
          engine,
          query: clean.q ?? clean.departure_id ?? engine,
          resultCount: countResults(data),
        }
        record({
          engine,
          query: result.query,
          at: new Date().toISOString(),
          latencyMs,
          resultCount: result.resultCount,
          cache: 'miss',
        })
        return result
      } catch (error) {
        lastError = error
        await sleep(400 * 2 ** attempt)
      }
    }
    record({
      engine,
      query: clean.q ?? engine,
      at: new Date().toISOString(),
      latencyMs: 0,
      resultCount: 0,
      cache: 'miss',
      error: lastError instanceof Error ? lastError.message : 'provider',
    })
    throw lastError instanceof Error ? lastError : new Error('SERPAPI_FAILED')
  })()

  inflight.set(id, run)
  try {
    return await run
  } finally {
    inflight.delete(id)
  }
}

export async function serpAccount(): Promise<SerpStats['account']> {
  const key = getSerpKey()
  if (!key) return undefined
  try {
    const response = await fetch(`${ACCOUNT}?api_key=${encodeURIComponent(key)}`)
    if (!response.ok) return undefined
    const data = (await response.json()) as Record<string, unknown>
    return {
      plan: typeof data.plan_name === 'string' ? data.plan_name : undefined,
      thisMonthUsage: typeof data.this_month_usage === 'number' ? data.this_month_usage : undefined,
      searchesPerMonth: typeof data.searches_per_month === 'number' ? data.searches_per_month : undefined,
    }
  } catch {
    return undefined
  }
}

export function getSerpStats(): SerpStats {
  const today = new Date().toISOString().slice(0, 10)
  const todayRows = stats.requests.filter((row) => row.at.startsWith(today))
  const latencies = todayRows.filter((row) => row.latencyMs > 0).map((row) => row.latencyMs)
  return {
    configured: isSerpConfigured(),
    lastRequest: stats.requests[0]
      ? {
          engine: stats.requests[0].engine,
          query: stats.requests[0].query,
          at: stats.requests[0].at,
          latencyMs: stats.requests[0].latencyMs,
          resultCount: stats.requests[0].resultCount,
          cache: stats.requests[0].cache,
        }
      : undefined,
    requestsToday: todayRows.length,
    cachedSearches: [...cache.values()].filter((entry) => entry.expires > Date.now()).length,
    errors: stats.errors,
    averageLatencyMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
  }
}

export function recentQueries() {
  const seen = new Set<string>()
  return stats.requests
    .filter((row) => {
      const key = `${row.engine}:${row.query}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 12)
    .map((row) => ({ engine: row.engine, query: row.query, at: row.at }))
}
