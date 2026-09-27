import { searchActivities, searchHotels, searchRestaurants } from '@/services/places/places'
import { citySeed } from '@/services/geo/seeds'
import type { PlaceResult } from '@/services/geo/types'
import type { TripNode } from '@/types'

export type StopKind = 'stay' | 'food' | 'activity'

export interface PriceOption {
  id: string
  label: string
  cost: number
  note: string
}

export interface NearbyStop {
  id: string
  name: string
  kind: StopKind
  city: string
  address?: string
  rating?: number
  lat?: number
  lng?: number
  image?: string
  source: 'live' | 'seed'
  options: PriceOption[]
}

const IMAGES: Record<StopKind, string[]> = {
  stay: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=70',
  ],
  food: [
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=70',
  ],
  activity: [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=70',
  ],
}

function kindFromPlace(category: PlaceResult['category']): StopKind {
  if (category === 'hotel') return 'stay'
  if (category === 'restaurant') return 'food'
  return 'activity'
}

function optionsFor(kind: StopKind, livePrice?: number): PriceOption[] {
  if (kind === 'stay') {
    const mid = livePrice && livePrice > 1000 ? livePrice : 7800
    return [
      { id: 'value', label: 'Value', cost: Math.round(mid * 0.62), note: 'Standard room · breakfast extra' },
      { id: 'standard', label: 'Standard', cost: Math.round(mid), note: 'Best-fit room for this circuit' },
      { id: 'premium', label: 'Premium', cost: Math.round(mid * 1.55), note: 'View / suite hold' },
    ]
  }
  if (kind === 'food') {
    const mid = livePrice && livePrice > 100 ? livePrice : 950
    return [
      { id: 'value', label: 'Light', cost: Math.round(mid * 0.55), note: 'Snack or thali' },
      { id: 'standard', label: 'Meal', cost: Math.round(mid), note: 'Two people, local kitchen' },
      { id: 'premium', label: 'Chef table', cost: Math.round(mid * 1.8), note: 'Tasting / reservation' },
    ]
  }
  const mid = livePrice && livePrice > 0 ? livePrice : 900
  return [
    { id: 'value', label: 'Walk-in', cost: 0, note: 'No ticket · time only' },
    { id: 'standard', label: 'Ticket', cost: Math.round(mid), note: 'Entry or guided slot' },
    { id: 'premium', label: 'Private', cost: Math.round(Math.max(mid, 400) * 2.2), note: 'Guide or exclusive window' },
  ]
}

function imageFor(kind: StopKind, images?: string[]) {
  if (images?.[0]) return images[0]
  return IMAGES[kind][0]
}

const FALLBACK: Record<string, Array<Omit<NearbyStop, 'options' | 'id'> & { kind: StopKind }>> = {
  default: [
    { name: 'City cafe & bakery', kind: 'food', city: '', address: 'Near the last hop', source: 'seed' },
    { name: 'Heritage walk', kind: 'activity', city: '', address: 'Old quarter loop', source: 'seed' },
    { name: 'Boutique inn', kind: 'stay', city: '', address: 'Walkable stay', source: 'seed' },
  ],
}

function seedStops(city: string): NearbyStop[] {
  const rows = FALLBACK[city.toLowerCase()] ?? FALLBACK.default
  return rows.map((row, index) => ({
    ...row,
    id: `seed-${city}-${index}`,
    city,
    options: optionsFor(row.kind),
    image: imageFor(row.kind),
  }))
}

function toStop(place: PlaceResult, city: string): NearbyStop {
  const kind = kindFromPlace(place.category)
  return {
    id: place.id,
    name: place.name,
    kind,
    city: place.address?.split(',')[1]?.trim() || city,
    address: place.address,
    rating: place.rating,
    lat: place.lat || undefined,
    lng: place.lng || undefined,
    image: imageFor(kind, place.images),
    source: place.source === 'live' ? 'live' : 'seed',
    options: optionsFor(kind, place.priceLevel ? place.priceLevel * 1800 : undefined),
  }
}

export async function searchNearbyStops(city: string, lat?: number, lng?: number): Promise<NearbyStop[]> {
  const pin = lat != null && lng != null ? { lat, lng } : citySeed(city)
  const near = city
  const [hotels, food, places] = await Promise.all([
    searchHotels(near).catch(() => []),
    searchRestaurants(near).catch(() => []),
    searchActivities(near).catch(() => []),
  ])
  const mapped = [
    ...hotels.map((item) => toStop({ ...item, category: 'hotel' }, city)),
    ...food.map((item) => toStop({ ...item, category: 'restaurant' }, city)),
    ...places.map((item) => toStop({ ...item, category: item.category === 'hotel' ? 'attraction' : item.category }, city)),
  ].filter((item) => item.name)
  const unique = new Map<string, NearbyStop>()
  for (const item of mapped) {
    const key = item.name.toLowerCase()
    if (!unique.has(key)) unique.set(key, item)
  }
  const list = [...unique.values()]
  if (list.length) return list.slice(0, 18)
  const seeded = seedStops(city)
  return seeded.map((item) =>
    pin ? { ...item, lat: pin.lat + (Math.random() - 0.5) * 0.02, lng: pin.lng + (Math.random() - 0.5) * 0.02 } : item,
  )
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function slotAfter(node?: TripNode | null) {
  const raw = node?.time?.split('–')[1]?.trim() ?? node?.time?.split('-')[1]?.trim() ?? node?.time ?? '12:00'
  const [h, m] = raw.split(':').map((part) => Number(part.replace(/\D/g, '')))
  const start = Number.isFinite(h) ? h * 60 + (m || 0) : 12 * 60
  const from = Math.min(start + 15, 22 * 60)
  const to = Math.min(from + 90, 23 * 60)
  return `${pad(Math.floor(from / 60))}:${pad(from % 60)} – ${pad(Math.floor(to / 60))}:${pad(to % 60)}`
}

export function categoryFor(kind: StopKind): TripNode['category'] {
  return kind
}
