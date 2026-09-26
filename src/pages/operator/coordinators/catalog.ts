import { loadTours, persistTours, type ManagedTour } from '@/pages/operator/tours/catalog'

export type DeskStatus = 'Available' | 'Assigned' | 'Offline'
export type Responsibility =
  | 'Traveler coordination'
  | 'Transport coordination'
  | 'Vendor coordination'
  | 'Emergency support'
  | 'Check-in assistance'

export const responsibilityOptions: Responsibility[] = [
  'Traveler coordination',
  'Transport coordination',
  'Vendor coordination',
  'Emergency support',
  'Check-in assistance',
]

export interface GeoPoint {
  label: string
  lat: number
  lng: number
  x: number
  y: number
}

export interface DeskCoordinator {
  id: string
  firstName: string
  name: string
  city: string
  location: string
  phone: string
  languages: string[]
  availability: string
  status: DeskStatus
  point: GeoPoint
  initials: string
}

export interface DeskAssignment {
  coordinatorId: string
  tourId: string
  tourCode: string
  fileNo: string
  party: string
  destination: string
  responsibilities: Responsibility[]
}

const ASSIGN_KEY = 'tf-ops-coord-assign'
const DESK_KEY = 'tf-ops-desk'

export const destPoints: Record<string, GeoPoint> = {
  Goa: { label: 'Goa', lat: 15.49, lng: 73.83, x: 262, y: 228 },
  Mumbai: { label: 'Mumbai', lat: 19.08, lng: 72.88, x: 248, y: 188 },
  Jaipur: { label: 'Jaipur', lat: 26.91, lng: 75.79, x: 292, y: 108 },
  Delhi: { label: 'Delhi', lat: 28.61, lng: 77.21, x: 318, y: 78 },
  Kerala: { label: 'Kerala', lat: 9.97, lng: 76.28, x: 286, y: 262 },
  Spiti: { label: 'Spiti', lat: 32.22, lng: 78.06, x: 350, y: 55 },
  Udaipur: { label: 'Udaipur', lat: 24.58, lng: 73.68, x: 268, y: 148 },
  Kutch: { label: 'Kutch', lat: 23.24, lng: 69.67, x: 210, y: 145 },
}

export const seedCoordinators: DeskCoordinator[] = [
  {
    id: 'dc-riya',
    firstName: 'Riya',
    name: 'Riya Patel',
    city: 'Goa',
    location: 'Candolim, Goa',
    phone: '+91 83220 44110',
    languages: ['English', 'Hindi', 'Marathi', 'Konkani'],
    availability: 'On shift till 20:00',
    status: 'Assigned',
    initials: 'RP',
    point: { label: 'Candolim', lat: 15.52, lng: 73.76, x: 256, y: 224 },
  },
  {
    id: 'dc-rohan',
    firstName: 'Rohan',
    name: 'Rohan Desai',
    city: 'Goa',
    location: 'Panaji, Goa',
    phone: '+91 83224 90811',
    languages: ['English', 'Hindi', 'Konkani'],
    availability: 'On shift till 18:00',
    status: 'Assigned',
    initials: 'RD',
    point: { label: 'Panaji', lat: 15.49, lng: 73.83, x: 270, y: 232 },
  },
  {
    id: 'dc-sana',
    firstName: 'Sana',
    name: 'Sana Qureshi',
    city: 'Mumbai',
    location: 'Colaba, Mumbai',
    phone: '+91 98200 44119',
    languages: ['English', 'Hindi', 'Urdu'],
    availability: 'On shift till 20:00',
    status: 'Assigned',
    initials: 'SQ',
    point: { label: 'Colaba', lat: 18.92, lng: 72.83, x: 242, y: 192 },
  },
  {
    id: 'dc-vikram',
    firstName: 'Vikram',
    name: 'Vikram Patel',
    city: 'Ahmedabad',
    location: 'Navrangpura, Ahmedabad',
    phone: '+91 79 4002 1188',
    languages: ['English', 'Hindi', 'Gujarati'],
    availability: 'On shift till 16:00',
    status: 'Assigned',
    initials: 'VP',
    point: { label: 'Ahmedabad', lat: 23.03, lng: 72.58, x: 236, y: 146 },
  },
  {
    id: 'dc-anjali',
    firstName: 'Anjali',
    name: 'Anjali Naik',
    city: 'Goa',
    location: 'Baga, Goa',
    phone: '+91 98221 66740',
    languages: ['English', 'Hindi', 'Konkani'],
    availability: 'Ready now',
    status: 'Available',
    initials: 'AN',
    point: { label: 'Baga', lat: 15.56, lng: 73.75, x: 264, y: 218 },
  },
  {
    id: 'dc-meera',
    firstName: 'Meera',
    name: 'Meera Iyer',
    city: 'Kerala',
    location: 'Fort Kochi',
    phone: '+91 484 221 9088',
    languages: ['English', 'Hindi', 'Malayalam'],
    availability: 'Ready from 07:00',
    status: 'Available',
    initials: 'MI',
    point: { label: 'Kochi', lat: 9.97, lng: 76.24, x: 280, y: 266 },
  },
  {
    id: 'dc-priya',
    firstName: 'Priya',
    name: 'Priya Nair',
    city: 'Jaipur',
    location: 'C-Scheme, Jaipur',
    phone: '+91 141 400 2210',
    languages: ['English', 'Hindi'],
    availability: 'Ready now',
    status: 'Available',
    initials: 'PN',
    point: { label: 'Jaipur', lat: 26.91, lng: 75.79, x: 298, y: 112 },
  },
  {
    id: 'dc-kabir',
    firstName: 'Kabir',
    name: 'Kabir Sen',
    city: 'Delhi',
    location: 'Connaught Place, Delhi',
    phone: '+91 11 4155 2201',
    languages: ['English', 'Hindi', 'Bengali'],
    availability: 'Offline till 06:00',
    status: 'Offline',
    initials: 'KS',
    point: { label: 'Delhi', lat: 28.63, lng: 77.22, x: 324, y: 74 },
  },
]

const seedAssignments: DeskAssignment[] = [
  {
    coordinatorId: 'dc-riya',
    tourId: 'op-aarav',
    tourCode: 'TF-WCC-10482',
    fileNo: 'TF-2026-10482',
    party: 'Aarav Shah · 2 adults',
    destination: 'Goa',
    responsibilities: ['Traveler coordination', 'Emergency support', 'Vendor coordination'],
  },
  {
    coordinatorId: 'dc-riya',
    tourId: 'op-anika',
    tourCode: 'TF-KER-11206',
    fileNo: 'TF-KER-11206',
    party: 'Anika Rao · 2 adults',
    destination: 'Kerala',
    responsibilities: ['Vendor coordination', 'Check-in assistance'],
  },
  {
    coordinatorId: 'dc-riya',
    tourId: 'op-naina',
    tourCode: 'TF-GOA-08112',
    fileNo: 'TF-GOA-08112',
    party: 'Naina Joshi · 2 adults',
    destination: 'Goa',
    responsibilities: ['Traveler coordination'],
  },
  {
    coordinatorId: 'dc-rohan',
    tourId: 'op-kabir',
    tourCode: 'TF-SPI-09031',
    fileNo: 'TF-SPI-09031',
    party: 'Kabir Malhotra · 11 photographers',
    destination: 'Spiti',
    responsibilities: ['Transport coordination', 'Emergency support'],
  },
  {
    coordinatorId: 'dc-rohan',
    tourId: 'op-raj',
    tourCode: 'TF-DEL-10091',
    fileNo: 'TF-DEL-10091',
    party: 'Rajiv Nair · 2 adults',
    destination: 'Delhi',
    responsibilities: ['Traveler coordination', 'Transport coordination'],
  },
  {
    coordinatorId: 'dc-sana',
    tourId: 'op-isha',
    tourCode: 'TF-WCC-11018',
    fileNo: 'TF-WCC-11018',
    party: 'Isha Menon · 2 adults',
    destination: 'Goa',
    responsibilities: ['Traveler coordination', 'Vendor coordination'],
  },
  {
    coordinatorId: 'dc-sana',
    tourId: 'op-dev',
    tourCode: 'TF-BOM-10117',
    fileNo: 'TF-BOM-10117',
    party: 'Dev Kapoor · 2 adults',
    destination: 'Mumbai',
    responsibilities: ['Check-in assistance', 'Transport coordination'],
  },
  {
    coordinatorId: 'dc-vikram',
    tourId: 'op-neha',
    tourCode: 'TF-JAI-10124',
    fileNo: 'TF-JAI-10124',
    party: 'Neha Bansal · 2 adults',
    destination: 'Jaipur',
    responsibilities: ['Traveler coordination', 'Vendor coordination'],
  },
  {
    coordinatorId: 'dc-vikram',
    tourId: 'op-udaipur',
    tourCode: 'TF-UDR-12240',
    fileNo: 'TF-UDR-12240',
    party: 'Isha Menon · 2 adults',
    destination: 'Udaipur',
    responsibilities: ['Check-in assistance'],
  },
]

export function loadAssignments(): DeskAssignment[] {
  const raw = localStorage.getItem(ASSIGN_KEY)
  if (!raw) return seedAssignments
  try {
    const extra = JSON.parse(raw) as DeskAssignment[]
    if (!Array.isArray(extra) || extra.length === 0) return seedAssignments
    return extra
  } catch {
    return seedAssignments
  }
}

export function persistAssignments(rows: DeskAssignment[]) {
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(rows))
}

export function loadDeskNames(): Record<string, string> {
  const raw = localStorage.getItem(DESK_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

export function persistDeskName(tourId: string, firstName: string) {
  const current = loadDeskNames()
  localStorage.setItem(DESK_KEY, JSON.stringify({ ...current, [tourId]: firstName }))
}

export function loadRoster(): DeskCoordinator[] {
  const rows = loadAssignments()
  return seedCoordinators.map((person) => {
    if (person.status === 'Offline') return person
    const live = rows.filter((row) => row.coordinatorId === person.id)
    return { ...person, status: live.length ? 'Assigned' : 'Available' }
  })
}

export function assignmentsFor(coordinatorId: string) {
  return loadAssignments().filter((row) => row.coordinatorId === coordinatorId)
}

export function tourFileNo(tour: ManagedTour) {
  return tour.id === 'op-aarav' ? 'TF-2026-10482' : tour.code
}

export function destFor(tour: ManagedTour): GeoPoint {
  return destPoints[tour.destination] ?? destPoints.Goa
}

export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}

export function distanceLabel(person: DeskCoordinator, tour: ManagedTour) {
  const km = haversineKm(person.point, destFor(tour))
  if (km < 8) return `${Math.max(km, 4)} km · same beach belt`
  if (km < 40) return `${km} km · same district`
  return `${km} km`
}

export function assignableRoster() {
  return loadRoster().filter((person) => person.status !== 'Offline')
}

export function confirmCopy(name: string, fileNo: string) {
  return `${name} assigned to Tour ${fileNo}`
}

export function applyCoordinatorAssignment(
  tour: ManagedTour,
  coordinator: DeskCoordinator,
  responsibilities: Responsibility[],
) {
  const fileNo = tourFileNo(tour)
  const next: DeskAssignment = {
    coordinatorId: coordinator.id,
    tourId: tour.id,
    tourCode: tour.code,
    fileNo,
    party: tour.party,
    destination: tour.destination,
    responsibilities,
  }
  persistAssignments([next, ...loadAssignments().filter((row) => row.tourId !== tour.id)])
  persistTours(loadTours().map((item) => (item.id === tour.id ? { ...item, coordinator: coordinator.firstName } : item)))
  persistDeskName(tour.id, coordinator.firstName)
  return confirmCopy(coordinator.name, fileNo)
}

export function deskFirstNames() {
  return seedCoordinators.map((person) => person.firstName)
}

export function findCoordinator(name: string) {
  const roster = loadRoster()
  return roster.find((person) => person.name === name || person.firstName === name) ?? null
}
