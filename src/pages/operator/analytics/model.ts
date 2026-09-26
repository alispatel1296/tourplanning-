export type DateRange = '30d' | 'quarter' | 'season' | 'ytd'
export type DestFilter = 'all' | 'Goa' | 'Mumbai' | 'Jaipur' | 'Delhi' | 'Kerala' | 'Spiti'
export type TravelerFilter = 'all' | 'FIT' | 'Premium' | 'Group'
export type VendorFilter = 'all' | 'Hotels' | 'Transport' | 'Activities' | 'Restaurants'
export type StatusFilter = 'all' | 'ongoing' | 'booked' | 'completed'

export interface AnalyticsFilters {
  range: DateRange
  destination: DestFilter
  traveler: TravelerFilter
  vendor: VendorFilter
  status: StatusFilter
}

export const defaultFilters: AnalyticsFilters = {
  range: 'season',
  destination: 'all',
  traveler: 'all',
  vendor: 'all',
  status: 'all',
}

export const filterOptions = {
  range: [
    { id: '30d', label: 'Last 30 days' },
    { id: 'quarter', label: 'This quarter' },
    { id: 'season', label: 'This season' },
    { id: 'ytd', label: 'Year to date' },
  ],
  destination: ['all', 'Goa', 'Mumbai', 'Jaipur', 'Delhi', 'Kerala', 'Spiti'] as DestFilter[],
  traveler: ['all', 'FIT', 'Premium', 'Group'] as TravelerFilter[],
  vendor: ['all', 'Hotels', 'Transport', 'Activities', 'Restaurants'] as VendorFilter[],
  status: ['all', 'ongoing', 'booked', 'completed'] as StatusFilter[],
}

const revenueAll = [
  { month: 'Apr', revenue: 18.4 },
  { month: 'May', revenue: 21.1 },
  { month: 'Jun', revenue: 16.8 },
  { month: 'Jul', revenue: 14.2 },
  { month: 'Aug', revenue: 15.9 },
  { month: 'Sep', revenue: 22.6 },
]

const destinationsAll = [
  { name: 'Goa', trips: 86, budget: 62400 },
  { name: 'Mumbai', trips: 54, budget: 41200 },
  { name: 'Jaipur', trips: 31, budget: 38900 },
  { name: 'Delhi', trips: 28, budget: 44800 },
  { name: 'Kerala', trips: 22, budget: 47100 },
  { name: 'Spiti', trips: 14, budget: 71800 },
]

const vendorsAll = [
  { name: 'Taj Cidade', score: 96, kind: 'Hotels' },
  { name: 'Novotel Goa', score: 90, kind: 'Hotels' },
  { name: 'MakeMyTrip Cabs', score: 88, kind: 'Transport' },
  { name: 'Goa Kayaking', score: 94, kind: 'Activities' },
  { name: "Fisherman's Wharf", score: 92, kind: 'Restaurants' },
]

const disruptionsAll = [
  { week: 'W1', weather: 2, stay: 1, transit: 1 },
  { week: 'W2', weather: 1, stay: 2, transit: 0 },
  { week: 'W3', weather: 4, stay: 1, transit: 2 },
  { week: 'W4', weather: 3, stay: 3, transit: 1 },
  { week: 'W5', weather: 2, stay: 1, transit: 1 },
  { week: 'W6', weather: 1, stay: 0, transit: 2 },
]

export interface Insight {
  title: string
  body: string
}

export interface AnalyticsSnapshot {
  kpis: {
    revenue: number
    conversion: number
    avgTrip: number
    avgBudget: number
    utilization: number
    completion: number
    revenueHint: string
    conversionHint: string
  }
  revenue: { month: string; revenue: number }[]
  destinations: { name: string; trips: number; budget: number }[]
  vendors: { name: string; score: number }[]
  disruptions: { week: string; weather: number; stay: number; transit: number }[]
  insights: Insight[]
}

function sliceRevenue(range: DateRange) {
  if (range === '30d') return revenueAll.slice(-2)
  if (range === 'quarter') return revenueAll.slice(-3)
  if (range === 'ytd') return revenueAll
  return revenueAll
}

function liveCircuitInsight(): Insight | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem('tf-live-mirror')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { disruption?: string; spent?: number }
    if (parsed.disruption === 'approved') {
      return {
        title: 'Aarav Shah reroute is desk-confirmed.',
        body: `Beach → indoor food is on the live path. Circuit spend is ₹${(parsed.spent ?? 55400).toLocaleString('en-IN')}. Weather W6 now shows a recovered activity instead of a cancellation.`,
      }
    }
    if (parsed.disruption === 'accepted') {
      return {
        title: 'Traveler accepted the Baga indoor swap.',
        body: 'Impact ₹400. Conflict console still needs operator approval before the desk path is locked.',
      }
    }
    if (parsed.disruption === 'staged') {
      return {
        title: 'Baga swell is live on West Coast Circuit.',
        body: 'Beach node is red. Indoor food alternative is staged. Same file as Aarav Shah’s live companion.',
      }
    }
  } catch {
    return null
  }
  return null
}

export function buildAnalytics(filters: AnalyticsFilters): AnalyticsSnapshot {
  const destBoost = filters.destination === 'Goa' ? 1.18 : filters.destination === 'all' ? 1 : 0.86
  const premium = filters.traveler === 'Premium' ? 1.12 : filters.traveler === 'Group' ? 0.94 : 1
  const activity = filters.vendor === 'Activities' ? 1.08 : 1
  const complete = filters.status === 'completed' ? 1.06 : 1

  const revenueRows = sliceRevenue(filters.range).map((row) => ({
    ...row,
    revenue: Number((row.revenue * destBoost * premium).toFixed(1)),
  }))
  const revenueLakhs = revenueRows.reduce((sum, row) => sum + row.revenue, 0)

  const destinations = destinationsAll
    .filter((row) => filters.destination === 'all' || row.name === filters.destination)
    .map((row) => ({
      ...row,
      trips: Math.round(row.trips * (filters.destination === row.name ? 1.18 : destBoost) * (filters.traveler === 'Group' ? 1.1 : 1)),
      budget: Math.round(row.budget * premium),
    }))

  const vendors = vendorsAll
    .filter((row) => filters.vendor === 'all' || row.kind === filters.vendor)
    .map((row) => ({ name: row.name, score: Math.min(99, row.score + (filters.vendor === row.kind ? 1 : 0)) }))

  const live = liveCircuitInsight()
  const disruptions = disruptionsAll.map((row, index) => ({
    ...row,
    weather:
      (filters.destination === 'Goa' || filters.vendor === 'Activities' ? row.weather + 1 : row.weather) +
      (live && index === disruptionsAll.length - 1 ? 1 : 0),
    stay: filters.vendor === 'Hotels' ? row.stay + 1 : row.stay,
  }))

  const conversion = Math.min(92, Math.round(64 * complete * (filters.traveler === 'Premium' ? 1.08 : 1)))
  const avgTrip = Math.round(54800 * premium * (filters.destination === 'Spiti' ? 1.2 : 1))
  const avgBudget = Math.round(62400 * premium)
  const utilization = Math.min(97, Math.round(81 * activity * (filters.vendor === 'Hotels' ? 1.04 : 1)))
  const completion = filters.status === 'completed' ? 100 : Math.round(93 * (filters.status === 'ongoing' ? 0.9 : 1))

  const insights: Insight[] = [
    ...(live ? [live] : []),
    {
      title: filters.destination === 'Goa' || filters.destination === 'all'
        ? 'Goa bookings increased 18% this month.'
        : `${filters.destination} is a thinner book than the west-coast core.`,
      body: filters.destination === 'Goa' || filters.destination === 'all'
        ? 'West-coast FITs and the Friends group are carrying September. Inventory is tight on Candolim nights.'
        : 'Volume is real but conversion lags Goa. Watch stay holds before you add departures.',
    },
    {
      title: 'Beach activities have the highest cancellation rate.',
      body: filters.vendor === 'Activities'
        ? 'Baga swell is the cancellation driver. Kayak inland slots recover more of the day.'
        : 'Weather desk still owns more lost revenue than hotel waitlists this season.',
    },
    {
      title: 'Premium travelers spend more on accommodation but less on activities.',
      body: filters.traveler === 'Premium'
        ? 'Taj and half-board are the lift. Activity attach is 11 points below FIT.'
        : 'FIT still buys the kayak and the shack. Premium buys the room and the quiet evening.',
    },
  ]

  return {
    kpis: {
      revenue: Math.round(revenueLakhs * 100000),
      conversion,
      avgTrip,
      avgBudget,
      utilization,
      completion,
      revenueHint: `${revenueRows.length} periods in view`,
      conversionHint: filters.status === 'completed' ? 'Closed files only' : 'Quotes to paid',
    },
    revenue: revenueRows,
    destinations,
    vendors,
    disruptions,
    insights,
  }
}

export function analyticsCsv(snapshot: AnalyticsSnapshot, filters: AnalyticsFilters) {
  const lines = [
    ['TripFlow AI · demo analytics'],
    ['Filters', `range=${filters.range}`, `destination=${filters.destination}`, `traveler=${filters.traveler}`, `vendor=${filters.vendor}`, `status=${filters.status}`],
    [],
    ['KPI', 'Value'],
    ['Revenue', String(snapshot.kpis.revenue)],
    ['Booking conversion', `${snapshot.kpis.conversion}%`],
    ['Average trip value', String(snapshot.kpis.avgTrip)],
    ['Average traveler budget', String(snapshot.kpis.avgBudget)],
    ['Vendor utilization', `${snapshot.kpis.utilization}%`],
    ['Tour completion', `${snapshot.kpis.completion}%`],
    [],
    ['Month', 'Revenue (₹ L)'],
    ...snapshot.revenue.map((row) => [row.month, String(row.revenue)]),
    [],
    ['Destination', 'Trips', 'Avg budget'],
    ...snapshot.destinations.map((row) => [row.name, String(row.trips), String(row.budget)]),
    [],
    ['Vendor', 'On-time'],
    ...snapshot.vendors.map((row) => [row.name, String(row.score)]),
  ]
  return lines.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
}

export function analyticsReport(snapshot: AnalyticsSnapshot, filters: AnalyticsFilters) {
  return [
    'TripFlow AI · Operator analytics brief',
    'Demo analytics — simulated from the Horizon Trails desk. Not live production data.',
    '',
    `View · ${filters.range} · ${filters.destination} · ${filters.traveler} · ${filters.vendor} · ${filters.status}`,
    '',
    `Revenue ${snapshot.kpis.revenue.toLocaleString('en-IN')} · Conversion ${snapshot.kpis.conversion}% · Avg trip ₹${snapshot.kpis.avgTrip.toLocaleString('en-IN')}`,
    `Avg budget ₹${snapshot.kpis.avgBudget.toLocaleString('en-IN')} · Vendor utilization ${snapshot.kpis.utilization}% · Completion ${snapshot.kpis.completion}%`,
    '',
    'AI insights',
    ...snapshot.insights.map((item) => `• ${item.title} ${item.body}`),
    '',
    'Destinations',
    ...snapshot.destinations.map((row) => `• ${row.name}: ${row.trips} trips, avg budget ₹${row.budget.toLocaleString('en-IN')}`),
  ].join('\n')
}

export function downloadText(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
