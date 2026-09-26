export type ServiceId = 'maps' | 'geocode' | 'routing' | 'places' | 'hotels' | 'weather' | 'currency' | 'ai'

export const env = {
  mapsKey: import.meta.env.VITE_MAPS_API_KEY?.trim() ?? '',
  weatherKey: import.meta.env.VITE_WEATHER_API_KEY?.trim() ?? '',
  placesKey: import.meta.env.VITE_PLACES_API_KEY?.trim() ?? '',
  aiKey: import.meta.env.VITE_AI_API_KEY?.trim() ?? '',
  geoapifyKey: import.meta.env.VITE_GEOAPIFY_KEY?.trim() ?? '',
  currencyKey: import.meta.env.VITE_CURRENCY_API_KEY?.trim() ?? '',
}

/** Public OSM stack works without keys. Optional keys upgrade providers. */
export function isConfigured(id: ServiceId): boolean {
  if (id === 'maps' || id === 'geocode' || id === 'routing' || id === 'weather' || id === 'currency') return true
  if (id === 'places' || id === 'hotels') return true
  if (id === 'ai') return Boolean(env.aiKey)
  return false
}

export function providerLabel(id: ServiceId): string {
  const labels: Record<ServiceId, string> = {
    maps: 'OpenStreetMap + Leaflet',
    geocode: 'Nominatim',
    routing: 'OSRM',
    places: env.placesKey ? 'Nominatim + Places key' : 'Nominatim / Overpass',
    hotels: 'Places search + demo availability',
    weather: env.weatherKey ? 'Open-Meteo + weather key' : 'Open-Meteo',
    currency: env.currencyKey ? 'Open ER-API + FX key' : 'Open ER-API',
    ai: env.aiKey ? 'OpenAI-compatible' : 'Local ranker (no key)',
  }
  return labels[id]
}
