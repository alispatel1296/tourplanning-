import type { GeoPoint, PlaceResult, RouteLeg, TransportProfile, WeatherDay, WeatherNow } from '@/services/geo/types'
import type { FxQuote } from '@/services/currency/currency'
import type { HotelAvailability } from '@/services/hotels/hotels'
import type { AIRecommendation, RankInput } from '@/services/ai/ai'

export interface GeocodingProvider {
  geocodeLocation: (query: string) => Promise<GeoPoint | null>
  reverseGeocode: (lat: number, lng: number) => Promise<GeoPoint | null>
}

export interface RoutingProvider {
  calculateRoute: (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode?: TransportProfile,
  ) => Promise<RouteLeg>
}

export interface PlacesProvider {
  searchPlaces: (query: string) => Promise<PlaceResult[]>
}

export interface HotelProvider {
  searchHotels: (near: string) => Promise<PlaceResult[]>
  getHotelDetails: (id: string) => Promise<PlaceResult | null>
  checkHotelAvailability: (id: string) => Promise<HotelAvailability>
}

export interface WeatherProvider {
  getCurrentWeather: (lat: number, lng: number) => Promise<WeatherNow>
  getForecast: (lat: number, lng: number) => Promise<WeatherDay[]>
}

export interface CurrencyProvider {
  convertCurrency: (amount: number, from?: string, to?: string) => Promise<FxQuote>
}

export interface AIProvider {
  explainRecommendation: (input: RankInput) => Promise<AIRecommendation>
  findAlternatives: (input: RankInput) => Promise<AIRecommendation>
  analyzeConflict: (bufferMinutes: number) => Promise<AIRecommendation>
}
