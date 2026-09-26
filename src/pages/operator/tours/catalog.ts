import { aaravAlert, aaravNotes, readLiveMirror } from '@/lib/liveMirror'
import type { TripNode } from '@/types'

export type TourLife = 'planning' | 'booked' | 'ongoing' | 'completed'

export interface ManagedTour {
  id: string
  code: string
  name: string
  party: string
  route: string
  destination: string
  start: string
  end: string
  dates: string
  budget: number
  spent: number
  status: TourLife
  coordinator: string
  alert: string
  pax: number
  travelerId?: string
  notes: string
}

const STORE = 'tf-ops-tours'

export const seedTours: ManagedTour[] = [
  {
    id: 'op-aarav',
    code: 'TF-WCC-10482',
    name: 'West Coast Circuit',
    party: 'Aarav Shah · 2 adults',
    route: 'Ahmedabad → Mumbai → Goa',
    destination: 'Goa',
    start: '2026-10-15',
    end: '2026-10-21',
    dates: '15–21 Oct 2026',
    budget: 63000,
    spent: 55800,
    status: 'ongoing',
    coordinator: 'Riya',
    alert: 'Weather Alert',
    pax: 2,
    travelerId: 'trav-aarav',
    notes: 'Live on Day 4. Baga swell is the open field risk.',
  },
  {
    id: 'op-isha',
    code: 'TF-WCC-11018',
    name: 'West Coast Circuit',
    party: 'Isha Menon · 2 adults',
    route: 'Bengaluru → Goa',
    destination: 'Goa',
    start: '2026-11-18',
    end: '2026-11-22',
    dates: '18–22 Nov 2026',
    budget: 54800,
    spent: 9800,
    status: 'booked',
    coordinator: 'Sana',
    alert: 'Hotel Hold',
    pax: 2,
    travelerId: 'trav-isha',
    notes: 'Air hold confirmed. Candolim night still yellow.',
  },
  {
    id: 'op-kabir',
    code: 'TF-SPI-09031',
    name: 'Spiti Shoulder',
    party: 'Kabir Malhotra · 11 photographers',
    route: 'Manali → Kaza → Tabo',
    destination: 'Spiti',
    start: '2026-10-03',
    end: '2026-10-10',
    dates: '03–10 Oct 2026',
    budget: 72000,
    spent: 68800,
    status: 'ongoing',
    coordinator: 'Rohan',
    alert: 'Buffer risk',
    pax: 11,
    travelerId: 'trav-kabir',
    notes: 'Group departure. Transit buffer under 45 minutes into Kaza.',
  },
  {
    id: 'op-neha',
    code: 'TF-JAI-10124',
    name: 'Pink City Week',
    party: 'Neha Bansal · 2 adults',
    route: 'Delhi → Jaipur',
    destination: 'Jaipur',
    start: '2026-10-12',
    end: '2026-10-16',
    dates: '12–16 Oct 2026',
    budget: 41000,
    spent: 27400,
    status: 'ongoing',
    coordinator: 'Vikram',
    alert: '',
    pax: 2,
    notes: 'Heritage stay confirmed. No open alerts.',
  },
  {
    id: 'op-dev',
    code: 'TF-BOM-10117',
    name: 'Island City FIT',
    party: 'Dev Kapoor · 2 adults',
    route: 'Ahmedabad → Mumbai',
    destination: 'Mumbai',
    start: '2026-10-14',
    end: '2026-10-17',
    dates: '14–17 Oct 2026',
    budget: 38500,
    spent: 22100,
    status: 'ongoing',
    coordinator: 'Sana',
    alert: 'Buffer risk',
    pax: 2,
    notes: 'Airport-road hotel. Evening Colaba is tight after the sea-link drive.',
  },
  {
    id: 'op-anika',
    code: 'TF-KER-11206',
    name: 'Backwaters & Spice',
    party: 'Anika Rao · 2 adults',
    route: 'Kochi → Alleppey → Munnar',
    destination: 'Kerala',
    start: '2026-11-20',
    end: '2026-11-26',
    dates: '20–26 Nov 2026',
    budget: 46990,
    spent: 0,
    status: 'booked',
    coordinator: 'Riya',
    alert: 'Hotel Hold',
    pax: 2,
    notes: 'Houseboat overlap on 21 Nov. Need a second night confirmed.',
  },
  {
    id: 'op-raj',
    code: 'TF-DEL-10091',
    name: 'Capital Circuit',
    party: 'Rajiv Nair · 2 adults',
    route: 'Mumbai → Delhi',
    destination: 'Delhi',
    start: '2026-10-09',
    end: '2026-10-13',
    dates: '09–13 Oct 2026',
    budget: 52000,
    spent: 40100,
    status: 'ongoing',
    coordinator: 'Rohan',
    alert: 'Weather Alert',
    pax: 2,
    notes: 'Inbound delay on 9 Oct. Keep the Red Fort morning or slip to 10 Oct.',
  },
  {
    id: 'op-udaipur',
    code: 'TF-UDR-12240',
    name: 'Lakes & Palaces',
    party: 'Isha Menon · 2 adults',
    route: 'Ahmedabad → Udaipur',
    destination: 'Udaipur',
    start: '2026-12-24',
    end: '2026-12-27',
    dates: '24–27 Dec 2026',
    budget: 42000,
    spent: 0,
    status: 'planning',
    coordinator: 'Vikram',
    alert: '',
    pax: 2,
    travelerId: 'trav-isha',
    notes: 'Brief only. No vendor holds yet.',
  },
  {
    id: 'op-naina',
    code: 'TF-GOA-08112',
    name: 'South Goa Slow',
    party: 'Naina Joshi · 2 adults',
    route: 'Pune → Palolem',
    destination: 'Goa',
    start: '2026-11-08',
    end: '2026-11-12',
    dates: '08–12 Nov 2026',
    budget: 36000,
    spent: 0,
    status: 'planning',
    coordinator: 'Riya',
    alert: '',
    pax: 2,
    travelerId: 'trav-naina',
    notes: 'Wellness + beach brief. Waiting on resort allotment.',
  },
  {
    id: 'op-kutch',
    code: 'TF-KUT-01130',
    name: 'Rann of Kutch',
    party: 'Aarav Shah · 2 adults',
    route: 'Ahmedabad → Bhuj → Dhordo',
    destination: 'Kutch',
    start: '2026-01-10',
    end: '2026-01-13',
    dates: '10–13 Jan 2026',
    budget: 28000,
    spent: 26450,
    status: 'completed',
    coordinator: 'Vikram',
    alert: '',
    pax: 2,
    travelerId: 'trav-aarav',
    notes: 'Closed. Photography hours were the standout.',
  },
]

export const coordinators = ['Riya', 'Rohan', 'Sana', 'Vikram']
export const destinations = [...new Set(seedTours.map((tour) => tour.destination))]

export function loadTours(): ManagedTour[] {
  const raw = localStorage.getItem(STORE)
  if (!raw) return seedTours.map(overlayAaravTour)
  try {
    const parsed = JSON.parse(raw) as ManagedTour[]
    return (parsed.length ? parsed : seedTours).map(overlayAaravTour)
  } catch {
    return seedTours.map(overlayAaravTour)
  }
}

function overlayAaravTour(tour: ManagedTour): ManagedTour {
  if (tour.id !== 'op-aarav') return tour
  const live = readLiveMirror()
  return { ...tour, spent: live.spent, alert: aaravAlert(), notes: aaravNotes() }
}

export function persistTours(tours: ManagedTour[]) {
  localStorage.setItem(STORE, JSON.stringify(tours))
}

export function itineraryFor(tour: ManagedTour, liveNodes?: TripNode[]): TripNode[] {
  if (tour.id === 'op-aarav') return liveNodes?.length ? liveNodes : readLiveMirror().nodes
  return [
    {
      id: `${tour.id}-a`,
      day: 1,
      date: tour.start,
      title: `Depart for ${tour.destination}`,
      city: tour.route.split('→')[0]?.trim() ?? '',
      time: '08:00',
      category: 'transport',
      status: tour.status === 'completed' ? 'visited' : 'upcoming',
      cost: 4200,
      notes: 'Operator hold.',
    },
    {
      id: `${tour.id}-b`,
      day: 1,
      date: tour.start,
      title: `${tour.destination} stay`,
      city: tour.destination,
      time: '14:00',
      category: 'stay',
      status: tour.status === 'completed' ? 'visited' : 'upcoming',
      cost: Math.round(tour.budget * 0.4),
      notes: tour.notes,
    },
    {
      id: `${tour.id}-c`,
      day: 2,
      date: tour.end,
      title: 'Headline activity',
      city: tour.destination,
      time: '10:00',
      category: 'activity',
      status: tour.status === 'completed' ? 'visited' : 'upcoming',
      cost: 2400,
      notes: 'Field desk to confirm slot.',
    },
  ]
}

export function activityLog(tour: ManagedTour) {
  const live = tour.id === 'op-aarav' ? readLiveMirror() : null
  const rows = [
    { time: '26 Sep 10:18', title: 'Desk reviewed live buffer', body: `${tour.coordinator} checked the next hop.` },
    { time: '24 Sep 09:18', title: tour.alert || 'No new field alert', body: tour.alert ? `${tour.alert} stays open on this file.` : 'Board is clean.' },
    { time: '22 Sep 16:40', title: 'AI itinerary pass', body: 'Feasibility scored and vendor holds refreshed.' },
  ]
  if (live?.disruption === 'approved') {
    rows.unshift({
      time: 'Just now',
      title: 'Operator approved indoor swap',
      body: 'Cooking class is the desk-confirmed green path after the Baga swell.',
    })
  } else if (live?.disruption === 'accepted') {
    rows.unshift({
      time: 'Just now',
      title: 'Traveler accepted AI reroute',
      body: 'Aarav Shah moved Beach activity → Cooking class. Impact ₹400. Approval still open.',
    })
  } else if (live?.disruption === 'staged') {
    rows.unshift({
      time: 'Just now',
      title: 'Weather disruption on live path',
      body: 'Baga beach is red. Indoor food alternative is staged in yellow.',
    })
  }
  if (tour.status === 'completed') {
    rows.unshift({ time: '13 Jan 18:20', title: 'Trip closed', body: 'Review captured on the traveler file.' })
  }
  return rows
}
