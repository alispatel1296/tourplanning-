import { cacheGet, cacheSet, TTL } from '@/services/cache'
import { getJson } from '@/services/http'
import { geocodeLocation } from '@/services/geo/geocode'
import { searchLocalBusinesses } from '@/services/travel/TravelDataService'
import type { PlaceResult } from '@/services/geo/types'

export interface PlaceFilters {
  query?: string
  near?: string
  lat?: number
  lng?: number
  radiusMeters?: number
  minRating?: number
  maxPrice?: number
  openNow?: boolean
  category?: PlaceResult['category']
}

interface NominatimHit {
  place_id: number
  lat: string
  lon: string
  display_name: string
  name?: string
  type?: string
  class?: string
  extratags?: { phone?: string; website?: string; opening_hours?: string }
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'

const KIND_QUERY: Record<NonNullable<PlaceFilters['category']>, string> = {
  hotel: 'hotel',
  restaurant: 'restaurant',
  activity: 'tourist attraction',
  attraction: 'tourist attraction',
  transport: 'railway station',
  airport: 'airport',
  other: '',
}

function kindFromTags(hit: NominatimHit, fallback: PlaceResult['category']): PlaceResult['category'] {
  const type = `${hit.class ?? ''} ${hit.type ?? ''}`.toLowerCase()
  if (type.includes('hotel') || type.includes('guest')) return 'hotel'
  if (type.includes('restaurant') || type.includes('cafe') || type.includes('food')) return 'restaurant'
  if (type.includes('airport')) return 'airport'
  if (type.includes('station') || type.includes('bus')) return 'transport'
  if (type.includes('attraction') || type.includes('museum') || type.includes('beach')) return 'attraction'
  return fallback
}

function mapHit(hit: NominatimHit, fallback: PlaceResult['category']): PlaceResult {
  return {
    id: `osm-${hit.place_id}`,
    name: hit.name || hit.display_name.split(',')[0],
    category: kindFromTags(hit, fallback),
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    address: hit.display_name,
    phone: hit.extratags?.phone,
    website: hit.extratags?.website,
    openingHours: hit.extratags?.opening_hours,
    images: [],
    source: 'live',
  }
}

async function nominatimSearch(q: string, category: PlaceResult['category']): Promise<PlaceResult[]> {
  const key = `places:${category}:${q.toLowerCase()}`
  const cached = cacheGet<PlaceResult[]>(key)
  if (cached) return cached
  const { data } = await getJson<NominatimHit[]>(
    `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&extratags=1&limit=8`,
  )
  const results = data.map((hit) => mapHit(hit, category))
  cacheSet(key, results, TTL.places)
  return results
}

export async function searchPlaces(filters: PlaceFilters = {}): Promise<PlaceResult[]> {
  const category = filters.category ?? 'other'
  let q = filters.query?.trim() ?? ''
  if (!q && filters.near) q = `${KIND_QUERY[category] || 'place'} near ${filters.near}`
  if (!q && filters.lat != null && filters.lng != null) {
    q = `${KIND_QUERY[category] || 'place'} near ${filters.lat},${filters.lng}`
  }
  if (!q && filters.near) q = filters.near
  if (!q) return []

  try {
    const live = await searchLocalBusinesses(q)
    if (live.items.length) {
      return live.items.map((item) => ({
        id: item.id,
        name: item.name,
        category,
        lat: item.latitude ?? 0,
        lng: item.longitude ?? 0,
        address: item.location,
        rating: item.rating,
        phone: item.phone,
        website: item.website,
        openingHours: item.openingHours,
        images: item.images,
        source: 'live' as const,
      }))
    }
    let results = await nominatimSearch(q, category)
    if (!results.length && filters.near) {
      const geo = await geocodeLocation(filters.near)
      if (geo) results = await nominatimSearch(`${KIND_QUERY[category] || q} ${geo.city || filters.near}`, category)
    }
    return results.filter((place) => {
      if (filters.minRating && (place.rating ?? 0) < filters.minRating) return false
      if (filters.maxPrice != null && place.priceLevel != null && place.priceLevel > filters.maxPrice) return false
      return true
    })
  } catch {
    return []
  }
}

export async function searchHotels(near: string) {
  return searchPlaces({ category: 'hotel', near, query: `hotels in ${near}` })
}

export async function searchRestaurants(near: string) {
  return searchPlaces({ category: 'restaurant', near, query: `restaurants near ${near}` })
}

export async function searchActivities(near: string) {
  return searchPlaces({ category: 'activity', near, query: `activities near ${near}` })
}

export async function searchAttractions(near: string) {
  return searchPlaces({ category: 'attraction', near, query: `tourist attractions in ${near}` })
}

export async function getPlaceDetails(id: string, fallback?: PlaceResult): Promise<PlaceResult | null> {
  const key = `place:${id}`
  const cached = cacheGet<PlaceResult>(key)
  if (cached) return cached
  if (fallback) {
    cacheSet(key, fallback, TTL.placeDetails)
    return fallback
  }
  return null
}
