import { searchPlaces } from '@/services/places/places'
import { geocodeLocation } from '@/services/geo/geocode'
import type { PlaceResult } from '@/services/geo/types'
import type { Trip, User } from '@/types'

export interface SearchGroup {
  id: string
  label: string
  items: Array<{ id: string; label: string; hint: string; to?: string; place?: PlaceResult }>
}

export async function globalSearch(query: string, trips: Trip[], people: User[] = []): Promise<SearchGroup[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const destHits: SearchGroup['items'] = []
  for (const city of ['Ahmedabad', 'Mumbai', 'Goa', 'Baga Beach', 'Candolim']) {
    if (city.toLowerCase().includes(q.toLowerCase())) {
      destHits.push({ id: `dest-${city}`, label: city, hint: 'Destination', to: '/traveler/trips/trip-amd-goa' })
    }
  }
  try {
    const geo = await geocodeLocation(q)
    if (geo && !destHits.some((item) => item.label.toLowerCase() === (geo.city || q).toLowerCase())) {
      destHits.push({
        id: `geo-${geo.placeId ?? geo.lat}`,
        label: geo.city || q,
        hint: geo.formattedAddress,
        to: '/traveler/trips/trip-amd-goa',
      })
    }
  } catch {
    /* keep local hits */
  }

  const tripHits = trips
    .filter((trip) => `${trip.title} ${trip.route}`.toLowerCase().includes(q.toLowerCase()))
    .map((trip) => ({ id: trip.id, label: trip.title, hint: 'Trip', to: `/traveler/trips/${trip.id}` }))

  const travelerHits = people
    .filter((person) => `${person.name} ${person.city}`.toLowerCase().includes(q.toLowerCase()))
    .map((person) => ({ id: person.id, label: person.name, hint: person.role, to: '/operator/customers' }))

  let hotels: PlaceResult[] = []
  let foods: PlaceResult[] = []
  let acts: PlaceResult[] = []
  try {
    ;[hotels, foods, acts] = await Promise.all([
      searchPlaces({ query: `hotel ${q}`, category: 'hotel' }),
      searchPlaces({ query: `restaurant ${q}`, category: 'restaurant' }),
      searchPlaces({ query: `attraction ${q}`, category: 'attraction' }),
    ])
  } catch {
    hotels = []
    foods = []
    acts = []
  }

  const groups: SearchGroup[] = [
    destHits.length ? { id: 'dest', label: 'DESTINATIONS', items: destHits } : null,
    tripHits.length ? { id: 'trips', label: 'TRIPS', items: tripHits } : null,
    hotels.length
      ? {
          id: 'hotels',
          label: 'HOTELS',
          items: hotels.slice(0, 4).map((place) => ({
            id: place.id,
            label: place.name,
            hint: place.address ?? 'Hotel',
            place,
            to: '/traveler/trips/trip-amd-goa',
          })),
        }
      : null,
    foods.length
      ? {
          id: 'food',
          label: 'RESTAURANTS',
          items: foods.slice(0, 4).map((place) => ({
            id: place.id,
            label: place.name,
            hint: place.address ?? 'Restaurant',
            place,
            to: '/traveler/trips/trip-amd-goa',
          })),
        }
      : null,
    acts.length
      ? {
          id: 'acts',
          label: 'ACTIVITIES',
          items: acts.slice(0, 4).map((place) => ({
            id: place.id,
            label: place.name,
            hint: place.address ?? 'Activity',
            place,
            to: '/traveler/trips/trip-amd-goa',
          })),
        }
      : null,
    travelerHits.length ? { id: 'people', label: 'TRAVELERS', items: travelerHits } : null,
  ].filter(Boolean) as SearchGroup[]

  return groups
}
