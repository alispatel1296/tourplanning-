import type { TravelEntity } from '@/services/travel/types'
import type { TripNode } from '@/types'

export function categoryFor(entity: TravelEntity): TripNode['category'] {
  if (entity.type === 'hotel') return 'stay'
  if (entity.type === 'restaurant') return 'food'
  if (entity.type === 'flight' || entity.type === 'train') return 'transport'
  if (entity.type === 'activity' || entity.type === 'attraction' || entity.type === 'event') return 'activity'
  return 'free'
}

export function entityToPatch(entity: TravelEntity): Partial<TripNode> {
  const priceNote = entity.priceStatus === 'price_unavailable' ? 'Price unavailable from the live source.' : ''
  return {
    title: entity.name,
    notes: [entity.description, entity.location, priceNote, entity.sourceLabel].filter(Boolean).join(' · '),
    cost: entity.price ?? 0,
    lat: entity.latitude,
    lng: entity.longitude,
    placeId: entity.placeId ?? entity.providerId,
    city: entity.location?.split(',')[0]?.trim() ?? undefined,
  }
}

export function priceLabel(entity: TravelEntity): string {
  if (entity.priceStatus === 'price_unavailable' || entity.price == null) return 'Price unavailable'
  return `${entity.currency ?? 'INR'} ${entity.price.toLocaleString('en-IN')}`
}

export function availabilityLabel(entity: TravelEntity): string {
  if (entity.availabilityStatus === 'confirmed_by_source') return 'Confirmed by source'
  if (entity.availabilityStatus === 'available_information') return 'Available information'
  return 'Availability unknown'
}
