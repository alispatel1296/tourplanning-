import { geocodeLocation } from '@/services/geo/geocode'
import { citySeed, seedLookup } from '@/services/geo/seeds'
import { calculateRoute, haversineMeters } from '@/services/maps/routing'
import type { RouteLeg, TransportProfile } from '@/services/geo/types'
import type { TripNode } from '@/types'

export interface LocatedNode extends TripNode {
  lat: number
  lng: number
  geoSource: 'live' | 'seed' | 'node'
}

const LONG_HOP_M = 280_000

export function isAirOrRail(node?: TripNode) {
  const text = `${node?.title ?? ''} ${node?.notes ?? ''} ${node?.category ?? ''}`.toLowerCase()
  return /flight|fly|airport|indigo|air india|sxr|amd|bom|goi|train|vande|rail|sleeper/.test(text)
}

export function queryFor(node: TripNode): string {
  const city = node.city?.trim()
  const title = node.title.trim()
  const hay = `${title} ${city} ${node.notes ?? ''}`
  const place = seedLookup(hay)
  if (place) return place.formattedAddress
  if (city && !/ahmedabad/i.test(title)) return `${title}, ${city}, India`
  return city ? `${city}, India` : title
}

export async function locateNode(node: TripNode): Promise<LocatedNode> {
  if (node.lat != null && node.lng != null) {
    return { ...node, lat: node.lat, lng: node.lng, geoSource: 'node' }
  }

  const hay = `${node.title} ${node.city} ${node.notes ?? ''}`
  const fromPlace = seedLookup(hay)
  if (fromPlace) return { ...node, lat: fromPlace.lat, lng: fromPlace.lng, geoSource: 'seed' }

  const fromCity = citySeed(node.city)
  if (fromCity) return { ...node, lat: fromCity.lat, lng: fromCity.lng, geoSource: 'seed' }

  try {
    const geo = await geocodeLocation(queryFor(node))
    if (geo) return { ...node, lat: geo.lat, lng: geo.lng, placeId: geo.placeId ?? node.placeId, geoSource: geo.source }
    const cityGeo = node.city ? await geocodeLocation(`${node.city}, India`) : null
    if (cityGeo) return { ...node, lat: cityGeo.lat, lng: cityGeo.lng, geoSource: cityGeo.source }
  } catch {
    /* keep walking */
  }

  const lastResort = citySeed(node.city) ?? citySeed('ahmedabad')
  return { ...node, lat: lastResort?.lat ?? 23.0225, lng: lastResort?.lng ?? 72.5714, geoSource: 'seed' }
}

function spreadStacked(nodes: LocatedNode[]): LocatedNode[] {
  const groups = new Map<string, LocatedNode[]>()
  for (const node of nodes) {
    const key = `${node.lat.toFixed(4)},${node.lng.toFixed(4)}`
    const list = groups.get(key) ?? []
    list.push(node)
    groups.set(key, list)
  }
  return nodes.map((node) => {
    const key = `${node.lat.toFixed(4)},${node.lng.toFixed(4)}`
    const pack = groups.get(key) ?? [node]
    if (pack.length < 2) return node
    const index = pack.findIndex((item) => item.id === node.id)
    const angle = (index / pack.length) * Math.PI * 2
    const radius = 0.018
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
  for (let i = 0; i < main.length - 1; i += 1) {
    const from = main[i]
    const to = main[i + 1]
    const meters = haversineMeters(from, to)
    if (meters < 250) continue
    const hop = isAirOrRail(from) || isAirOrRail(to) || meters >= LONG_HOP_M
    if (hop) {
      legs.push(await calculateRoute(from, to, 'driving', { straight: true }))
    } else {
      legs.push(await calculateRoute(from, to, modeFor(from)))
    }
  }
  return legs
}
