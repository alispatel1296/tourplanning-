export type Role = 'traveler' | 'operator' | 'coordinator' | 'vendor'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'neutral'

export type TripStatus = 'draft' | 'planning' | 'ready' | 'live' | 'completed' | 'cancelled'
export type NodeStatus = 'upcoming' | 'active' | 'visited' | 'skipped' | 'disrupted' | 'alternative'
export type BookingStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'failed'
export type ConflictSeverity = 'low' | 'medium' | 'high'
export type ConflictState = 'open' | 'investigating' | 'resolved'
export type VendorType = 'hotel' | 'transport' | 'activity' | 'guide' | 'transfer'
export type TransportMode = 'train' | 'flight' | 'cab' | 'ferry' | 'walk'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  city: string
  avatarInitials: string
  phone: string
}

export interface TravelerProfile extends User {
  home: string
  travelStyle: string[]
  interests: string[]
  preferredStay: string
}

export interface Money {
  amount: number
  currency: 'INR'
}

export interface Destination {
  id: string
  city: string
  state: string
  label: string
}

export interface TripNode {
  id: string
  day: number
  date: string
  title: string
  city: string
  time: string
  category: 'stay' | 'food' | 'activity' | 'transport' | 'free'
  status: NodeStatus
  cost: number
  notes: string
  vendorId?: string
  lat?: number
  lng?: number
  placeId?: string
}

export interface Alternative {
  id: string
  title: string
  reason: string
  impact: string
  extraCost: number
  risk: 'low' | 'medium' | 'high'
  selected?: boolean
}

export interface Trip {
  id: string
  title: string
  route: string
  origin: Destination
  destinations: Destination[]
  startDate: string
  endDate: string
  travelers: number
  adults: number
  budget: number
  spent: number
  status: TripStatus
  travelStyle: string[]
  accommodation: string
  transport: string[]
  interests: string[]
  feasibility: number
  nodes: TripNode[]
  alternatives: Alternative[]
}

export interface Vendor {
  id: string
  name: string
  type: VendorType
  city: string
  rating: number
  reliability: number
  priceBand: string
  status: 'active' | 'watch' | 'inactive'
  contact: string
  specialties: string[]
}

export interface Coordinator {
  id: string
  name: string
  city: string
  phone: string
  activeTours: number
  rating: number
  shift: string
  status: 'on-duty' | 'standby' | 'off'
}

export interface Booking {
  id: string
  tripId: string
  travelerName: string
  vendorId: string
  vendorName: string
  category: VendorType
  item: string
  date: string
  amount: number
  status: BookingStatus
  pax: number
}

export interface Conflict {
  id: string
  title: string
  description: string
  severity: ConflictSeverity
  state: ConflictState
  tripId: string
  tripTitle: string
  city: string
  detectedAt: string
  owner: string
  source?: string
}

export interface TourProduct {
  id: string
  name: string
  route: string
  duration: string
  nextDeparture: string
  seats: number
  booked: number
  priceFrom: number
  status: 'open' | 'filling' | 'full' | 'paused'
  coordinator: string
}

export interface GroupTour {
  id: string
  name: string
  dates: string
  pax: number
  lead: string
  status: 'confirmed' | 'forming' | 'departed'
  city: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  tone: StatusTone
  read: boolean
}

export interface AIInsight {
  id: string
  title: string
  body: string
  confidence: number
  actionLabel?: string
}

export interface ActivityItem {
  id: string
  title: string
  city: string
  duration: string
  price: number
  rating: number
  category: string
  slot: string
}
