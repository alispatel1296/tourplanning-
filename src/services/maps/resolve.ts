import { geocodeLocation } from '@/services/geo/geocode'
import { seedLookup } from '@/services/geo/seeds'
import { calculateTripRoute } from '@/services/maps/routing'
import type { GeoPoint, RouteLeg, TransportProfile } from '@/services/geo/types'
import type { TripNode } from '@/types'

export interface LocatedNode extends TripNode {
  lat: number
  lng: number
  geoSource: 'live' | 'seed' | 'node'
}

function queryFor(node: TripNode): string {
  if (/kalupur/i.test(node.title)) return 'Kalupur Railway Station Ahmedabad'
  if (/baga/i.test(`${node.title} ${node.city}`)) return 'Baga Beach Goa'
  if (/novotel/i.test(node.title)) return 'Novotel Goa Candolim'
  if (/fern/i.test(node.title)) return 'The Fern Mumbai Andheri'
  if (/trishna/i.test(node.title)) return 'Trishna Fort Mumbai'
  if (/taj/i.test(node.title)) return 'Taj Cidade de Goa'
  return `${node.title} ${node.city}`
}

export async function locateNode(node: TripNode): Promise<LocatedNode> {
  if (node.lat != null && node.lng != null) {
    return { ...node, lat: node.lat, lng: node.lng, geoSource: 'node' }
  }
  const seed = seedLookup(queryFor(node)) ?? seedLookup(node.city)
  if (seed) return { ...node, lat: seed.lat, lng: seed.lng, geoSource: 'seed' }
  try {
    const geo = await geocodeLocation(queryFor(node))
    if (geo) return { ...node, lat: geo.lat, lng: geo.lng, placeId: geo.placeId ?? node.placeId, geoSource: geo.source }
  } catch {
    /* fallback */
  }
  const fallback = { lat: 15.4909, lng: 73.8278, source: 'seed' } as GeoPoint
  return { ...node, lat: fallback.lat, lng: fallback.lng, geoSource: 'seed' }
}

export async function locateNodes(nodes: TripNode[]): Promise<LocatedNode[]> {
  const out: LocatedNode[] = []
  for (const node of nodes) out.push(await locateNode(node))
  return out
}

export function modeFor(node?: TripNode): TransportProfile {
  const text = `${node?.title ?? ''} ${node?.notes ?? ''}`.toLowerCase()
  if (text.includes('walk')) return 'walking'
  if (text.includes('cycle') || text.includes('bike')) return 'cycling'
  if (text.includes('train') || text.includes('flight') || text.includes('indigo')) return 'driving'
  return 'driving'
}

export async function routesForNodes(nodes: LocatedNode[]): Promise<RouteLeg[]> {
  const main = nodes.filter((node) => node.status !== 'alternative')
  if (main.length < 2) return []
  const { legs } = await calculateTripRoute(
    main.map((node) => ({ lat: node.lat, lng: node.lng })),
    modeFor(main.find((node) => node.category === 'transport')),
  )
  return legs
}
