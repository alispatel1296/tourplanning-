export type TravelEntityType =
  | 'destination'
  | 'hotel'
  | 'restaurant'
  | 'activity'
  | 'attraction'
  | 'flight'
  | 'train'
  | 'event'
  | 'shopping'
  | 'image'
  | 'review'
  | 'local'
  | 'news'
  | 'info'

export interface TravelEntity {
  id: string
  type: TravelEntityType
  name: string
  description?: string
  location?: string
  latitude?: number
  longitude?: number
  rating?: number
  reviewCount?: number
  price?: number
  currency?: string
  priceStatus: 'price_shown' | 'price_unavailable'
  availabilityStatus: 'confirmed_by_source' | 'available_information' | 'availability_unknown'
  images: string[]
  openingHours?: string
  website?: string
  phone?: string
  sourceUrl?: string
  bookingUrl?: string
  amenities?: string[]
  placeId?: string
  providerId?: string
  source: 'google_via_serpapi'
  sourceLabel: string
  lastFetchedAt: string
  scores?: {
    budgetFit: number
    locationFit: number
    ratingFit: number
    preferenceFit: number
    timeFit: number
    availabilityFit: number
  }
  reasons?: string[]
  fitLabel?: string
}

export interface TravelSearchMeta {
  engine: string
  query: string
  latencyMs: number
  resultCount: number
  cache: 'hit' | 'miss'
  configured: boolean
  error?: string
}

export interface TravelSearchResult<T = TravelEntity> {
  items: T[]
  meta: TravelSearchMeta
  message?: string
}

export interface ComposedOption {
  id: string
  title: string
  focus: string
  hotel?: TravelEntity
  restaurant?: TravelEntity
  activity?: TravelEntity
  flight?: TravelEntity
  estimatedTotal?: number
  remaining?: number
  tradeoffs: string[]
  reasons: string[]
}

export interface ComposeTripResult {
  configured: boolean
  destinations: TravelEntity[]
  hotels: TravelEntity[]
  restaurants: TravelEntity[]
  activities: TravelEntity[]
  attractions: TravelEntity[]
  flights: TravelEntity[]
  options: ComposedOption[]
  metas: TravelSearchMeta[]
  message?: string
}

export interface SerpHealth {
  configured: boolean
  status: 'connected' | 'not_configured'
  provider: string
  stats: {
    lastRequest?: { engine: string; query: string; at: string; latencyMs: number; resultCount: number; cache: string }
    requestsToday: number
    cachedSearches: number
    errors: number
    averageLatencyMs: number
    account?: { plan?: string; thisMonthUsage?: number; searchesPerMonth?: number }
    history?: Array<{ engine: string; query: string; at: string }>
  }
}
