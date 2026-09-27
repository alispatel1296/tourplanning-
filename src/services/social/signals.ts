import { apiUrl } from '@/lib/api'

export interface SocialSignal {
  id: string
  source: 'google_news' | 'google_search'
  title: string
  snippet: string
  url?: string
  city?: string
  publishedAt?: string
  sentiment: number
  topics: string[]
  weatherRelated: boolean
}

export interface SocialSignalResult {
  items: SocialSignal[]
  configured: boolean
  message?: string
}

const TOPIC_RULES: Array<[string, RegExp]> = [
  ['rain', /\brain|shower|monsoon|downpour|wet\b/i],
  ['storm', /\bstorm|thunder|cyclone|gale|squall\b/i],
  ['flood', /\bflood|waterlog|inundat|tide|swell\b/i],
  ['heat', /\bheat|heatwave|scorch|humid\b/i],
  ['cancel', /\bcancel|closed|shutdown|suspend|called off\b/i],
  ['delay', /\bdelay|late|disrupted|stranded|waitlist\b/i],
  ['travel', /\btourist|traveler|traveller|hotel|beach|flight|train\b/i],
]

function topicsOf(text: string): string[] {
  return TOPIC_RULES.filter(([, pattern]) => pattern.test(text)).map(([topic]) => topic)
}

function sentimentOf(text: string, topics: string[]): number {
  let score = 0
  if (/\bclear|sunny|open|packed|beautiful|good\b/i.test(text)) score += 0.35
  if (/\brain|storm|flood|cancel|delay|closed|warning|alert\b/i.test(text)) score -= 0.4
  if (topics.includes('flood') || topics.includes('cancel')) score -= 0.25
  if (topics.includes('heat')) score -= 0.1
  return Math.max(-1, Math.min(1, Number(score.toFixed(2))))
}

export function toSocialSignals(
  items: Array<{
    id?: string
    name?: string
    description?: string
    sourceUrl?: string
    location?: string
    lastFetchedAt?: string
    sourceLabel?: string
  }>,
  city: string,
  source: SocialSignal['source'],
): SocialSignal[] {
  return items.map((item, index) => {
    const title = item.name ?? 'Untitled signal'
    const snippet = item.description ?? ''
    const text = `${title} ${snippet}`
    const topics = topicsOf(text)
    return {
      id: item.id ?? `${source}-${city}-${index}`,
      source,
      title,
      snippet,
      url: item.sourceUrl,
      city,
      publishedAt: item.lastFetchedAt,
      sentiment: sentimentOf(text, topics),
      topics,
      weatherRelated: topics.some((topic) => ['rain', 'storm', 'flood', 'heat'].includes(topic)) || /weather/i.test(text),
    }
  })
}

export async function fetchSocialSignals(cities: string[]): Promise<SocialSignalResult> {
  const unique = [...new Set(cities.map((city) => city.trim()).filter(Boolean))].slice(0, 3)
  try {
    const response = await fetch(apiUrl('/api/travel/social-signals'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cities: unique }),
    })
    if (!response.ok) {
      return { items: [], configured: false, message: 'Social signals are temporarily unavailable.' }
    }
    const data = (await response.json()) as {
      items?: Array<{
        id?: string
        name?: string
        description?: string
        sourceUrl?: string
        location?: string
        lastFetchedAt?: string
        sourceLabel?: string
      }>
      meta?: { configured?: boolean }
      message?: string
    }
    const raw = Array.isArray(data.items) ? data.items : []
    const items = raw.flatMap((item) => {
      const city = item.location ?? unique[0] ?? 'Goa'
      const source = /news/i.test(item.sourceLabel ?? '') ? 'google_news' : 'google_search'
      return toSocialSignals([item], city, source)
    })
    return {
      items,
      configured: Boolean(data.meta?.configured),
      message: data.message,
    }
  } catch {
    return { items: [], configured: false, message: 'Social signals are temporarily unavailable.' }
  }
}

export interface TwinExplainResult {
  narrative: string
  source?: 'nugen' | 'local' | 'openrouter'
  model?: string
  stage?: 'aligned' | 'base'
  confidence?: number
}

export async function explainTwin(payload: Record<string, unknown>): Promise<TwinExplainResult | null> {
  try {
    const response = await fetch(apiUrl('/api/travel/twin-explain'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) return null
    const data = (await response.json()) as TwinExplainResult
    return data.narrative ? data : null
  } catch {
    return null
  }
}

export async function fetchNugenStatus(): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(apiUrl('/api/nugen/status'))
    if (!response.ok) return null
    return (await response.json()) as Record<string, unknown>
  } catch {
    return null
  }
}
