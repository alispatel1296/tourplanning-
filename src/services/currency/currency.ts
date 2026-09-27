import { cacheGet, cacheSet, TTL } from '@/services/cache'
import { getJson } from '@/services/http'

export interface FxQuote {
  from: string
  to: string
  rate: number
  amount: number
  converted: number
  timestamp: string
  source: 'live' | 'catalog'
}

interface OpenEr {
  result?: string
  time_last_update_utc?: string
  rates?: Record<string, number>
}

const DEMO: Record<string, number> = { USD: 0.012, EUR: 0.011, GBP: 0.0094, INR: 1 }

export async function convertCurrency(amount: number, from = 'INR', to = 'USD'): Promise<FxQuote> {
  if (from === to) {
    return { from, to, rate: 1, amount, converted: amount, timestamp: new Date().toISOString(), source: 'live' }
  }
  const key = `fx:${from}:${to}`
  const cached = cacheGet<FxQuote>(key)
  if (cached) {
    return { ...cached, amount, converted: Math.round(amount * cached.rate * 100) / 100 }
  }
  try {
    const { data } = await getJson<OpenEr>(`https://open.er-api.com/v6/latest/${from}`)
    const rate = data.rates?.[to]
    if (!rate) throw new Error('empty')
    const quote: FxQuote = {
      from,
      to,
      rate,
      amount,
      converted: Math.round(amount * rate * 100) / 100,
      timestamp: data.time_last_update_utc ?? new Date().toISOString(),
      source: 'live',
    }
    cacheSet(key, quote, TTL.currency)
    return quote
  } catch {
    const rate = from === 'INR' ? (DEMO[to] ?? 0.012) : 1 / (DEMO[from] ?? 1)
    return {
      from,
      to,
      rate,
      amount,
      converted: Math.round(amount * rate * 100) / 100,
      timestamp: new Date().toISOString(),
      source: 'catalog',
    }
  }
}
