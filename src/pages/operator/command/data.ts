export interface OpsTour {
  id: string
  tour: string
  traveler: string
  destination: string
  dates: string
  status: 'ongoing' | 'departing' | 'confirmed' | 'delayed'
  budget: number
  coordinator: string
  alert: string
  cluster: 'Mumbai' | 'Goa' | 'Jaipur' | 'Delhi' | 'Kerala'
}

export const opsTours: OpsTour[] = [
  {
    id: 'op-aarav',
    tour: 'West Coast Circuit',
    traveler: 'Aarav Shah',
    destination: 'Ahmedabad → Goa',
    dates: '15–21 Oct',
    status: 'ongoing',
    budget: 63000,
    coordinator: 'Riya',
    alert: 'Weather Alert',
    cluster: 'Goa',
  },
  {
    id: 'op-isha',
    tour: 'West Coast Circuit',
    traveler: 'Isha Menon',
    destination: 'Bengaluru → Goa',
    dates: '18–22 Nov',
    status: 'confirmed',
    budget: 54800,
    coordinator: 'Sana',
    alert: 'Hotel Hold',
    cluster: 'Goa',
  },
  {
    id: 'op-kabir',
    tour: 'Spiti Shoulder',
    traveler: 'Kabir Malhotra',
    destination: 'Manali → Kaza',
    dates: '03–10 Oct',
    status: 'departing',
    budget: 72000,
    coordinator: 'Rohan',
    alert: 'Buffer risk',
    cluster: 'Delhi',
  },
  {
    id: 'op-neha',
    tour: 'Pink City Week',
    traveler: 'Neha Bansal',
    destination: 'Delhi → Jaipur',
    dates: '12–16 Oct',
    status: 'ongoing',
    budget: 41000,
    coordinator: 'Vikram',
    alert: '',
    cluster: 'Jaipur',
  },
  {
    id: 'op-dev',
    tour: 'Island City FIT',
    traveler: 'Dev Kapoor',
    destination: 'Ahmedabad → Mumbai',
    dates: '14–17 Oct',
    status: 'ongoing',
    budget: 38500,
    coordinator: 'Sana',
    alert: 'Buffer risk',
    cluster: 'Mumbai',
  },
  {
    id: 'op-meera',
    tour: 'Backwaters & Spice',
    traveler: 'Anika Rao',
    destination: 'Kochi → Alleppey',
    dates: '20–26 Nov',
    status: 'confirmed',
    budget: 46990,
    coordinator: 'Riya',
    alert: 'Hotel Hold',
    cluster: 'Kerala',
  },
  {
    id: 'op-raj',
    tour: 'Capital Circuit',
    traveler: 'Rajiv Nair',
    destination: 'Mumbai → Delhi',
    dates: '09–13 Oct',
    status: 'delayed',
    budget: 52000,
    coordinator: 'Rohan',
    alert: 'Weather Alert',
    cluster: 'Delhi',
  },
]

export const opsClusters = [
  { id: 'Mumbai', count: 7, x: 248, y: 188 },
  { id: 'Goa', count: 6, x: 262, y: 228 },
  { id: 'Jaipur', count: 4, x: 292, y: 108 },
  { id: 'Delhi', count: 4, x: 318, y: 78 },
  { id: 'Kerala', count: 3, x: 286, y: 262 },
] as const

export const opsAlerts = [
  {
    id: 'weather',
    tone: 'warning' as const,
    title: '3 tours affected by weather',
    body: 'Baga swell plus a Delhi inbound delay. Aarav Shah, Rajiv Nair, and the 15 Oct group sit on the weather desk.',
    to: '/operator/conflicts',
  },
  {
    id: 'hotel',
    tone: 'warning' as const,
    title: '2 hotel availability conflicts',
    body: 'Novotel Candolim waitlist and an Alleppey houseboat overlap. Two FITs still need a confirmed night.',
    to: '/operator/conflicts',
  },
  {
    id: 'optimized',
    tone: 'success' as const,
    title: '5 itineraries optimized',
    body: 'AI tightened transit buffers and re-sequenced two Goa afternoons. No traveler notification sent yet.',
    to: '/operator/analytics',
  },
]
