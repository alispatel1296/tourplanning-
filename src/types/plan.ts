export type Companion = 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Group'
export type StayClass = 'Budget' | 'Comfort' | 'Premium' | 'Luxury'
export type TransportPref = 'Train' | 'Flight' | 'Bus' | 'Car' | 'Mixed'
export type Intensity = 'Relaxed' | 'Balanced' | 'Packed'

export interface TripPlan {
  origin: string
  destinations: string[]
  startDate: string
  endDate: string
  adults: number
  children: number
  infants: number
  companion: Companion
  styles: string[]
  accommodation: StayClass
  transport: TransportPref
  food: string[]
  intensity: Intensity
  budget: number
  brief: string
}

export interface Place {
  id: string
  name: string
  state: string
  tagline: string
  image: string
  x: number
  y: number
}
