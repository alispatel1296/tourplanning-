import { geocodeLocation } from '@/services/geo/geocode'
import { citySeed, seedLookup } from '@/services/geo/seeds'
import { calculateRoute, haversineMeters, inIndia } from '@/services/maps/routing'
import type { RouteLeg, TransportProfile } from '@/services/geo/types'
import type { TripNode } from '@/types'

export interface LocatedNode extends TripNode {
  lat: number
  lng: number
  geoSource: 'live' | 'seed' | 'node'
}

const LONG_HOP_M = 80_000
const CITY_SNAP_M = 90_000

export { inIndia } from '@/services/maps/routing'

export function isAirOrRail(node?: TripNode) {
  const text = `${node?.title ?? ''} ${node?.notes ?? ''} ${node?.category ?? ''}`.toLowerCase()
  return /flight|fly|airport|indigo|air india|sxr|amd|bom|goi|train|vande|rail|sleeper|return/.test(text)
}

function inCity(
  point: { lat: number; lng: number },
  cityPin: { lat: number; lng: number } | null,
) {
  if (!cityPin) return true
  return haversineMeters(point, cityPin) <= CITY_SNAP_M
}

export function queryFor(node: TripNode): string {
  const city = node.city?.trim()
  const title = node.title.trim()
  const place = seedLookup(title) ?? (city ? seedLookup(`${title} ${city}`) : null)
  if (place) return place.formattedAddress
  const clean = title.replace(/^(visit|lunch at|dinner at|check-in at|checkout)\s+/i, '').trim()
  if (city) return `${clean}, ${city}, India`
  return title
}

export async function locateNode(node: TripNode): Promise<LocatedNode> {
  const cityPin = citySeed(node.city)
  const placed = (lat: number, lng: number, geoSource: LocatedNode['geoSource'], placeId?: string): LocatedNode | null => {
    if (!inIndia({ lat, lng })) return null
    if (!inCity({ lat, lng }, cityPin)) return null
    return { ...node, lat, lng, placeId: placeId ?? node.placeId, geoSource }
  }

  const fromTitle = seedLookup(node.title)
  if (fromTitle) {
    const hit = placed(fromTitle.lat, fromTitle.lng, 'seed')
    if (hit) return hit
  }

  const fromHay = seedLookup(`${node.title} ${node.city}`)
  if (fromHay) {
    const hit = placed(fromHay.lat, fromHay.lng, 'seed')
    if (hit) return hit
  }

  if (node.lat != null && node.lng != null) {
    const hit = placed(node.lat, node.lng, 'node')
    if (hit) return hit
  }

  if (cityPin) {
    try {
      const geo = await geocodeLocation(queryFor(node))
      if (geo) {
        const hit = placed(geo.lat, geo.lng, geo.source, geo.placeId)
        if (hit) return hit
      }
    } catch {
      /* city pin is enough */
    }
    return { ...node, lat: cityPin.lat, lng: cityPin.lng, geoSource: 'seed' }
  }

  try {
    const geo = await geocodeLocation(queryFor(node))
    if (geo) return { ...node, lat: geo.lat, lng: geo.lng, placeId: geo.placeId ?? node.placeId, geoSource: geo.source }
  } catch {
    /* keep walking */
  }

  const lastResort = cityPin ?? citySeed(node.title) ?? citySeed('ahmedabad')
  return { ...node, lat: lastResort?.lat ?? 23.0225, lng: lastResort?.lng ?? 72.5714, geoSource: 'seed' }
}

function spreadStacked(nodes: LocatedNode[]): LocatedNode[] {
  const groups = new Map<string, LocatedNode[]>()
  for (const node of nodes) {
    const key = `${node.lat.toFixed(3)},${node.lng.toFixed(3)}`
    const list = groups.get(key) ?? []
    list.push(node)
    groups.set(key, list)
  }
  return nodes.map((node) => {
    const key = `${node.lat.toFixed(3)},${node.lng.toFixed(3)}`
    const pack = groups.get(key) ?? [node]
    if (pack.length < 2) return node
    const index = pack.findIndex((item) => item.id === node.id)
    const angle = (index / pack.length) * Math.PI * 2
    const radius = 0.004
    return {
      ...node,
      lat: node.lat + Math.sin(angle) * radius,
      lng: node.lng + Math.cos(angle) * radius,
    }
  })
}

export async function locateNodes(nodes: TripNode[]): Promise<LocatedNode[]> {
  const out: LocatedNode[] = []
  for (const node of nodes) out.push(await locateNode(node))
  return spreadStacked(out)
}

export function modeFor(node?: TripNode): TransportProfile {
  const text = `${node?.title ?? ''} ${node?.notes ?? ''}`.toLowerCase()
  if (text.includes('walk')) return 'walking'
  if (text.includes('cycle') || text.includes('bike')) return 'cycling'
  return 'driving'
}

function sortItinerary(nodes: LocatedNode[]) {
  return [...nodes].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time) || a.id.localeCompare(b.id))
}

export async function routesForNodes(nodes: LocatedNode[]): Promise<RouteLeg[]> {
  const main = sortItinerary(nodes.filter((node) => node.status !== 'alternative' && node.status !== 'disrupted'))
  if (main.length < 2) return []

  const legs: RouteLeg[] = []
  const cityHops = new Set<string>()
  for (let i = 0; i < main.length - 1; i += 1) {
    const from = main[i]
    const to = main[i + 1]
    if (!inIndia(from) || !inIndia(to)) continue
    const meters = haversineMeters(from, to)
    if (meters < 700) continue
    const fromCity = from.city.trim().toLowerCase()
    const toCity = to.city.trim().toLowerCase()
    const cityChange = fromCity !== toCity
    if (cityChange) {
      const key = `${fromCity}>${toCity}`
      if (cityHops.has(key)) continue
      cityHops.add(key)
      legs.push(await calculateRoute(from, to, 'driving', { straight: true }))
      continue
    }
    const hop = isAirOrRail(from) || isAirOrRail(to) || meters >= LONG_HOP_M
    if (hop) {
      legs.push(await calculateRoute(from, to, 'driving', { straight: true }))
    } else {
      legs.push(await calculateRoute(from, to, modeFor(from)))
    }
  }
  return legs
}
