import { cacheGet, cacheSet, TTL } from '@/services/cache'
import { getJson } from '@/services/http'
import type { RouteLeg, TransportProfile } from '@/services/geo/types'

interface OsrmResponse {
  code: string
  routes?: Array<{
    distance: number
    duration: number
    geometry: { coordinates: [number, number][] }
  }>
}

const OSRM = 'https://router.project-osrm.org/route/v1'
const PROFILE: Record<TransportProfile, string> = {
  driving: 'driving',
  walking: 'foot',
  cycling: 'bike',
  transit: 'driving',
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function fallbackLeg(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  mode: TransportProfile,
  straight = false,
): RouteLeg {
  const meters = haversineMeters(origin, dest)
  const speed = straight ? 220 : mode === 'walking' ? 1.3 : mode === 'cycling' ? 4.5 : 18
  return {
    distanceMeters: meters,
    durationSeconds: meters / speed,
    geometry: [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ],
    mode,
    fallbackMode: mode,
  }
}

export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TransportProfile = 'driving',
  options?: { straight?: boolean },
): Promise<RouteLeg> {
  if (options?.straight) return fallbackLeg(origin, destination, mode, true)
  const key = `route:${mode}:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}:${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`
  const cached = cacheGet<RouteLeg>(key)
  if (cached) return cached

  const profile = PROFILE[mode]
  const url = `${OSRM}/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
  try {
    const { data } = await getJson<OsrmResponse>(url)
    const route = data.routes?.[0]
    if (!route) {
      const fallback = fallbackLeg(origin, destination, mode)
      cacheSet(key, fallback, TTL.route)
      return fallback
    }
    const leg: RouteLeg = {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      mode: mode === 'transit' ? 'driving' : mode,
      fallbackMode: mode === 'transit' ? 'driving' : undefined,
    }
    cacheSet(key, leg, TTL.route)
    return leg
  } catch {
    const fallback = fallbackLeg(origin, destination, mode)
    cacheSet(key, fallback, TTL.route)
    return fallback
  }
}

export async function calculateTripRoute(
  points: Array<{ lat: number; lng: number }>,
  mode: TransportProfile = 'driving',
): Promise<{ legs: RouteLeg[]; totalDistanceMeters: number; totalDurationSeconds: number }> {
  const legs: RouteLeg[] = []
  for (let i = 0; i < points.length - 1; i += 1) {
    legs.push(await calculateRoute(points[i], points[i + 1], mode))
  }
  return {
    legs,
    totalDistanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
    totalDurationSeconds: legs.reduce((sum, leg) => sum + leg.durationSeconds, 0),
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters >= 100000 ? 0 : 1)} km`
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} hr`
  return `${hours} hr ${minutes} min`
}
