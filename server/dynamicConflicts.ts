import { searchSocialSignals } from './travelDataService'
import { aviationFlights } from './liveApis'
import { geocodeCity } from './cityCodes'
import { openRouterChat, parseJsonObject } from './openrouter'

export interface LiveConflict {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  state: 'open' | 'investigating' | 'resolved'
  tripId: string
  tripTitle: string
  city: string
  detectedAt: string
  owner: string
  source?: string
}

interface WeatherCell {
  city: string
  temperature_2m?: number
  precipitation?: number
  precipitation_probability?: number
  weather_code?: number
  wind_speed_10m?: number
  error?: string
}

async function weatherCell(city: string): Promise<WeatherCell> {
  const coords = await geocodeCity(city)
  if (!coords) return { city, error: 'weather unavailable' }
  const [lat, lng] = coords
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,precipitation,precipitation_probability,wind_speed_10m`
    const response = await fetch(url)
    if (!response.ok) return { city, error: 'weather unavailable' }
    const data = (await response.json()) as { current?: Omit<WeatherCell, 'city' | 'error'> }
    return { city, ...data.current }
  } catch {
    return { city, error: 'weather unavailable' }
  }
}

export async function buildLiveConflicts(input: {
  tripId: string
  tripTitle: string
  cities: string[]
  origin?: string
}): Promise<{ conflicts: LiveConflict[]; sources: string[]; model?: string }> {
  const cities = [...new Set(input.cities.filter(Boolean))].slice(0, 4)
  const dest = cities[cities.length - 1] || 'Goa'
  const origin = input.origin || cities[0] || 'Ahmedabad'
  const [weather, social, flights] = await Promise.all([
    Promise.all(cities.map((city) => weatherCell(city))),
    searchSocialSignals(cities),
    aviationFlights(origin, dest),
  ])

  const payload = {
    trip: { id: input.tripId, title: input.tripTitle, cities },
    weather,
    social: social.items.slice(0, 8).map((item) => ({ name: item.name, description: item.description, location: item.location })),
    flights,
  }

  const ai = await openRouterChat({
    system:
      'You are Horizon Trails’ conflicts desk. Turn live weather, public news, and flight pulses into operator conflicts. Never invent a hotel name. Return JSON {conflicts:[{title,description,severity,state,city,owner}]}. severity low|medium|high. state open|investigating. 3-6 items. If weather is calm and flights are on time, still emit watch-level items from social signals or say corridor is quiet with one low watch.',
    user: JSON.stringify(payload),
    maxTokens: 900,
  })

  const parsed = ai ? parseJsonObject<{ conflicts: Array<Partial<LiveConflict>> }>(ai.content) : null
  const now = new Date().toISOString()
  const conflicts = (parsed?.conflicts ?? []).slice(0, 6).map((row, index) => ({
    id: `live-cf-${index + 1}`,
    title: row.title || `Live watch in ${row.city || dest}`,
    description: row.description || 'Live signal requires desk review.',
    severity: row.severity === 'high' || row.severity === 'low' ? row.severity : 'medium',
    state: row.state === 'investigating' || row.state === 'resolved' ? row.state : 'open',
    tripId: input.tripId,
    tripTitle: input.tripTitle,
    city: row.city || dest,
    detectedAt: now,
    owner: row.owner || 'Live twin desk',
    source: 'openrouter+open-meteo+serpapi+aviationstack',
  }))

  if (!conflicts.length) {
    const wet = weather.find((cell) => (cell.precipitation_probability ?? 0) >= 50 || (cell.precipitation ?? 0) >= 1)
    if (wet) {
      conflicts.push({
        id: 'live-cf-weather',
        title: `Live weather pressure · ${wet.city}`,
        description: `${wet.temperature_2m ?? '—'}°C · precip ${wet.precipitation ?? 0} mm · ${wet.precipitation_probability ?? 0}% chance. Outdoor nodes need a yellow indoor alternative.`,
        severity: (wet.precipitation_probability ?? 0) >= 70 ? 'high' : 'medium',
        state: 'open',
        tripId: input.tripId,
        tripTitle: input.tripTitle,
        city: wet.city,
        detectedAt: now,
        owner: 'Weather twin',
        source: 'open-meteo',
      })
    }
    flights
      .filter((flight) => (flight.delayMinutes ?? 0) >= 15 || /cancel|divert/i.test(flight.status ?? ''))
      .slice(0, 2)
      .forEach((flight, index) => {
        conflicts.push({
          id: `live-cf-air-${index}`,
          title: `${flight.flight || 'Flight'} ${flight.status || 'delayed'}`,
          description: `${flight.airline || 'Airline'} ${flight.from}→${flight.to}. Delay ${flight.delayMinutes ?? 0} min from AviationStack.`,
          severity: (flight.delayMinutes ?? 0) >= 40 ? 'high' : 'medium',
          state: 'open',
          tripId: input.tripId,
          tripTitle: input.tripTitle,
          city: dest,
          detectedAt: now,
          owner: 'Aviation desk',
          source: 'aviationstack',
        })
      })
  }

  return {
    conflicts,
    sources: ['Open-Meteo', social.meta.configured ? 'SerpApi news' : null, flights.length ? 'AviationStack' : null, ai ? 'OpenRouter' : null].filter(Boolean) as string[],
    model: ai?.model,
  }
}
