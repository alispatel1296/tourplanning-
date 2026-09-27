import { cacheGet, cacheSet, TTL } from '@/services/cache'
import { getJson } from '@/services/http'
import { citySeed, seedLookup } from '@/services/geo/seeds'
import { haversineMeters, inIndia } from '@/services/maps/routing'
import type { GeoPoint } from '@/services/geo/types'

interface NominatimHit {
  lat: string
  lon: string
  display_name: string
  place_id: number
  address?: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'

function fromHit(hit: NominatimHit): GeoPoint {
  const address = hit.address ?? {}
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    formattedAddress: hit.display_name,
    city: address.city ?? address.town ?? address.village ?? '',
    state: address.state ?? '',
    country: address.country ?? '',
    placeId: String(hit.place_id),
    source: 'live',
  }
}

export async function geocodeLocation(query: string): Promise<GeoPoint | null> {
  const q = query.trim()
  if (!q) return null
  const cacheKey = `geo:${q.toLowerCase()}`
  const cached = cacheGet<GeoPoint>(cacheKey)
  if (cached) return cached

  const cityHint = q.split(',').map((part) => part.trim()).find((part) => citySeed(part))
  const cityPin = cityHint ? citySeed(cityHint) : citySeed(q)
  const seed = seedLookup(q) ?? cityPin
  const simple = q.split(/[,\s]+/).filter(Boolean).length <= 2
  if (seed && simple) {
    cacheSet(cacheKey, { ...seed, source: 'seed' }, TTL.geocode)
    return { ...seed, source: 'seed' }
  }
  try {
    const { data } = await getJson<NominatimHit[]>(
      `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1&countrycodes=in`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const hit = data[0]
    if (!hit) {
      if (seed) {
        const seeded = { ...seed, source: 'seed' as const }
        cacheSet(cacheKey, seeded, TTL.geocode)
        return seeded
      }
      return null
    }
    const point = fromHit(hit)
    if (!inIndia(point) || (cityPin && haversineMeters(point, cityPin) > 90_000)) {
      const fallback = seed ?? cityPin
      if (!fallback) return null
      const pinned = { ...fallback, source: 'seed' as const }
      cacheSet(cacheKey, pinned, TTL.geocode)
      return pinned
    }
    cacheSet(cacheKey, point, TTL.geocode)
    return point
  } catch {
    if (seed) {
      const seeded = { ...seed, source: 'seed' as const }
      cacheSet(cacheKey, seeded, TTL.geocode)
      return seeded
    }
    return null
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoPoint | null> {
  const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`
  const cached = cacheGet<GeoPoint>(cacheKey)
  if (cached) return cached
  try {
    const { data } = await getJson<NominatimHit>(
      `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    )
    const point = fromHit(data)
    cacheSet(cacheKey, point, TTL.geocode)
    return point
  } catch {
    return {
      lat,
      lng,
      formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: '',
      state: '',
      country: '',
      source: 'seed',
    }
  }
}

export async function geocodeMany(queries: string[]): Promise<GeoPoint[]> {
  const out: GeoPoint[] = []
  for (const query of queries) {
    const point = await geocodeLocation(query)
    if (point) out.push(point)
  }
  return out
}
