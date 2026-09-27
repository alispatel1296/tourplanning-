export interface GeoPoint {
  lat: number
  lng: number
  formattedAddress: string
  city: string
  state: string
  country: string
  placeId?: string
  source: 'live' | 'seed'
}

export type TransportProfile = 'driving' | 'walking' | 'cycling' | 'transit'

export interface RouteLeg {
  distanceMeters: number
  durationSeconds: number
  geometry: [number, number][]
  mode: TransportProfile
  fallbackMode?: TransportProfile
}

export interface PlaceResult {
  id: string
  name: string
  category: 'hotel' | 'restaurant' | 'activity' | 'attraction' | 'transport' | 'airport' | 'other'
  lat: number
  lng: number
  address?: string
  rating?: number
  priceLevel?: number
  phone?: string
  website?: string
  openingHours?: string
  images: string[]
  source: 'live' | 'demo'
}

export interface WeatherNow {
  temperatureC: number
  condition: string
  weatherCode: number
  precipitationProbability: number
  precipitationMm: number
  windKmh: number
  humidity: number
  source: 'live' | 'demo'
}

export interface WeatherHour {
  time: string
  temperatureC: number
  precipitationMm: number
  precipitationProbability: number
  weatherCode: number
  windKmh: number
  condition: string
}

export interface WeatherBundle {
  now: WeatherNow
  hourly: WeatherHour[]
  lat: number
  lng: number
}

export interface WeatherDay {
  date: string
  maxC: number
  minC: number
  precipitationProbability: number
  condition: string
  weatherCode: number
}
