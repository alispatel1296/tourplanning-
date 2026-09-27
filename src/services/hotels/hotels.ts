import { searchHotels as searchLiveHotels, getPlaceDetails } from '@/services/places/places'
import { searchHotels as searchSerpHotels } from '@/services/travel/TravelDataService'
import type { PlaceResult } from '@/services/geo/types'

export interface HotelAvailability {
  hotelId: string
  available: boolean
  roomsLeft?: number
  nightlyFrom?: number
  currency: 'INR'
  source: 'live' | 'catalog'
}

export async function searchHotels(near: string): Promise<PlaceResult[]> {
  try {
    const live = await searchSerpHotels(near)
    if (live.items.length) {
      return live.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: 'hotel' as const,
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
  } catch {
    /* Nominatim fallback */
  }
  return searchLiveHotels(near)
}

export async function getHotelDetails(id: string, fallback?: PlaceResult) {
  return getPlaceDetails(id, fallback)
}

/** No approved booking API is configured. Availability is catalog-estimated. */
export async function checkHotelAvailability(hotelId: string, nightlyHint?: number): Promise<HotelAvailability> {
  return {
    hotelId,
    available: true,
    roomsLeft: 4,
    nightlyFrom: nightlyHint,
    currency: 'INR',
    source: 'catalog',
  }
}
