import type { GeoPoint } from '@/services/geo/types'

const seed = (point: Omit<GeoPoint, 'source'>): GeoPoint => ({ ...point, source: 'seed' })

export const CITY_SEEDS: Record<string, GeoPoint> = {
  ahmedabad: seed({ lat: 23.0225, lng: 72.5714, formattedAddress: 'Ahmedabad, Gujarat, India', city: 'Ahmedabad', state: 'Gujarat', country: 'India' }),
  mumbai: seed({ lat: 19.076, lng: 72.8777, formattedAddress: 'Mumbai, Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', country: 'India' }),
  bombay: seed({ lat: 19.076, lng: 72.8777, formattedAddress: 'Mumbai, Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', country: 'India' }),
  goa: seed({ lat: 15.4909, lng: 73.8278, formattedAddress: 'Panaji, Goa, India', city: 'Goa', state: 'Goa', country: 'India' }),
  panaji: seed({ lat: 15.4909, lng: 73.8278, formattedAddress: 'Panaji, Goa, India', city: 'Panaji', state: 'Goa', country: 'India' }),
  baga: seed({ lat: 15.5553, lng: 73.7517, formattedAddress: 'Baga Beach, Goa, India', city: 'Baga', state: 'Goa', country: 'India' }),
  'baga beach': seed({ lat: 15.5553, lng: 73.7517, formattedAddress: 'Baga Beach, Goa, India', city: 'Baga', state: 'Goa', country: 'India' }),
  candolim: seed({ lat: 15.518, lng: 73.763, formattedAddress: 'Candolim, Goa, India', city: 'Candolim', state: 'Goa', country: 'India' }),
  palolem: seed({ lat: 15.01, lng: 74.023, formattedAddress: 'Palolem Beach, Goa, India', city: 'Palolem', state: 'Goa', country: 'India' }),
  ponda: seed({ lat: 15.401, lng: 74.007, formattedAddress: 'Ponda, Goa, India', city: 'Ponda', state: 'Goa', country: 'India' }),
  kalupur: seed({ lat: 23.028, lng: 72.601, formattedAddress: 'Kalupur Railway Station, Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', country: 'India' }),
  andheri: seed({ lat: 19.1136, lng: 72.8697, formattedAddress: 'Andheri, Mumbai, India', city: 'Mumbai', state: 'Maharashtra', country: 'India' }),
}

export const PLACE_SEEDS: Record<string, GeoPoint> = {
  'taj cidade de goa': seed({ lat: 15.458, lng: 73.804, formattedAddress: 'Taj Cidade de Goa, Vainguinim, Goa', city: 'Goa', state: 'Goa', country: 'India' }),
  novotel: seed({ lat: 15.538, lng: 73.764, formattedAddress: 'Novotel Goa Candolim', city: 'Candolim', state: 'Goa', country: 'India' }),
  'fern hotel': seed({ lat: 19.136, lng: 72.827, formattedAddress: 'The Fern, Andheri, Mumbai', city: 'Mumbai', state: 'Maharashtra', country: 'India' }),
  trishna: seed({ lat: 18.932, lng: 72.833, formattedAddress: 'Trishna, Fort, Mumbai', city: 'Mumbai', state: 'Maharashtra', country: 'India' }),
}

export function seedLookup(query: string): GeoPoint | null {
  const key = query.trim().toLowerCase()
  if (CITY_SEEDS[key]) return CITY_SEEDS[key]
  if (PLACE_SEEDS[key]) return PLACE_SEEDS[key]
  for (const [name, point] of Object.entries({ ...PLACE_SEEDS, ...CITY_SEEDS })) {
    if (key.includes(name) || name.includes(key)) return point
  }
  return null
}
