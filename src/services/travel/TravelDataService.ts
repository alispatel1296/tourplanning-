import { apiUrl } from '@/lib/api'
import type {
  ComposeTripResult,
  LiveConflictsResult,
  LivePlanResult,
  SerpHealth,
  TravelEntity,
  TravelSearchResult,
} from '@/services/travel/types'

async function post<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(apiUrl(`/api/travel/${path}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error('LIVE_SEARCH_UNAVAILABLE')
  }
  return (await response.json()) as T
}

function remember(label: string) {
  try {
    const raw = sessionStorage.getItem('tf-serp-history')
    const items = raw ? (JSON.parse(raw) as string[]) : []
    sessionStorage.setItem('tf-serp-history', JSON.stringify([label, ...items.filter((item) => item !== label)].slice(0, 12)))
  } catch {
    /* ignore */
  }
}

export function recentSearches(): string[] {
  try {
    const raw = sessionStorage.getItem('tf-serp-history')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export async function searchDestinations(q: string): Promise<TravelSearchResult> {
  remember(`Destinations · ${q}`)
  return post('destinations', { q })
}

export async function searchHotels(destination: string, extras: Record<string, unknown> = {}): Promise<TravelSearchResult> {
  remember(`Hotels · ${destination}`)
  return post('hotels', { destination, ...extras })
}

export async function searchRestaurants(near: string): Promise<TravelSearchResult> {
  remember(`Restaurants · ${near}`)
  return post('restaurants', { near })
}

export async function searchActivities(near: string, interest?: string): Promise<TravelSearchResult> {
  remember(`Activities · ${near}`)
  return post('activities', { near, interest })
}

export async function searchAttractions(near: string): Promise<TravelSearchResult> {
  remember(`Attractions · ${near}`)
  return post('attractions', { near })
}

export async function searchFlights(input: {
  origin: string
  destination: string
  date: string
  returnDate?: string
  adults?: number
}): Promise<TravelSearchResult> {
  remember(`Flights · ${input.origin} ${input.destination}`)
  return post('flights', input)
}

export async function searchTravelInformation(q: string): Promise<TravelSearchResult> {
  remember(`Info · ${q}`)
  return post('info', { q })
}

export async function searchEvents(near: string): Promise<TravelSearchResult> {
  return post('events', { near })
}

export async function searchShopping(q: string): Promise<TravelSearchResult> {
  return post('shopping', { q })
}

export async function searchImages(q: string): Promise<TravelSearchResult> {
  return post('images', { q })
}

export async function searchReviews(placeId: string): Promise<TravelSearchResult> {
  return post('reviews', { placeId })
}

export async function searchLocalBusinesses(q: string): Promise<TravelSearchResult> {
  remember(q)
  return post('local', { q })
}

export async function searchMaps(q: string): Promise<TravelSearchResult> {
  return post('maps', { q })
}

export async function searchNews(q: string): Promise<TravelSearchResult> {
  return post('news', { q })
}

export async function searchSocialSignals(cities: string[]): Promise<TravelSearchResult> {
  remember(`Social · ${cities.join(', ')}`)
  return post('social-signals', { cities })
}

export async function searchTrains(origin: string, destination: string): Promise<TravelSearchResult> {
  return post('trains', { origin, destination })
}

export async function compareTransport(origin: string, destination: string, date: string) {
  return post<{ flights: TravelEntity[]; trains: TravelEntity[]; buses: TravelEntity[]; message?: string }>('transport', {
    origin,
    destination,
    date,
  })
}

export async function composeTrip(input: Record<string, unknown>): Promise<ComposeTripResult> {
  remember('Compose trip')
  return post('compose', input)
}

export async function planLive(input: Record<string, unknown>): Promise<LivePlanResult> {
  remember('Live itinerary')
  return post('plan-live', input)
}

export async function fetchLiveConflicts(input: {
  tripId: string
  tripTitle: string
  cities: string[]
  origin?: string
}): Promise<LiveConflictsResult> {
  remember(`Conflicts · ${input.cities.join(', ')}`)
  return post('conflicts-live', input)
}

export async function getSerpHealth(): Promise<SerpHealth> {
  const response = await fetch(apiUrl('/api/travel/health'))
  if (!response.ok) {
    return {
      configured: false,
      status: 'not_configured',
      provider: 'SerpApi',
      stats: { requestsToday: 0, cachedSearches: 0, errors: 0, averageLatencyMs: 0 },
    }
  }
  return (await response.json()) as SerpHealth
}

export async function getSerpStats(): Promise<SerpHealth['stats']> {
  const response = await fetch(apiUrl('/api/travel/stats'))
  if (!response.ok) return { requestsToday: 0, cachedSearches: 0, errors: 0, averageLatencyMs: 0 }
  return (await response.json()) as SerpHealth['stats']
}
