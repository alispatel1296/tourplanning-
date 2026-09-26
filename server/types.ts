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

export type PriceStatus = 'price_shown' | 'price_unavailable'
export type AvailabilityStatus = 'confirmed_by_source' | 'available_information' | 'availability_unknown'

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
  priceStatus: PriceStatus
  availabilityStatus: AvailabilityStatus
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
}

export interface ScoredEntity extends TravelEntity {
  scores: {
    budgetFit: number
    locationFit: number
    ratingFit: number
    preferenceFit: number
    timeFit: number
    availabilityFit: number
  }
  reasons: string[]
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

export interface SearchPlan {
  origin: string
  destination: string
  interests: string[]
  budget: number
  duration: number
  adults: number
  checkIn: string
  checkOut: string
  queries: Array<{ id: string; engine: string; q: string; purpose: string }>
}

export interface ComposedOption {
  id: string
  title: string
  focus: string
  hotel?: ScoredEntity
  restaurant?: ScoredEntity
  activity?: ScoredEntity
  flight?: TravelEntity
  estimatedTotal?: number
  remaining?: number
  tradeoffs: string[]
  reasons: string[]
}

export interface ComposeTripResult {
  configured: boolean
  plan: SearchPlan
  destinations: ScoredEntity[]
  hotels: ScoredEntity[]
  restaurants: ScoredEntity[]
  activities: ScoredEntity[]
  attractions: TravelEntity[]
  flights: TravelEntity[]
  transport: TravelEntity[]
  options: ComposedOption[]
  metas: TravelSearchMeta[]
  message?: string
}

export interface SerpStats {
  configured: boolean
  lastRequest?: { engine: string; query: string; at: string; latencyMs: number; resultCount: number; cache: string }
  requestsToday: number
  cachedSearches: number
  errors: number
  averageLatencyMs: number
  account?: {
    plan?: string
    thisMonthUsage?: number
    searchesPerMonth?: number
  }
}
