import type { Place, TripPlan } from '@/types/plan'
import type { Trip, TripNode } from '@/types'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

export const PLAN_KEY = 'tf-plan'

export const places: Place[] = [
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    tagline: 'Home city',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=70',
    x: 92,
    y: 168,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    tagline: 'Coastal nights',
    image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2d4c?auto=format&fit=crop&w=800&q=70',
    x: 168,
    y: 132,
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    tagline: 'Beaches & spice',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=70',
    x: 196,
    y: 214,
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    tagline: 'Palaces & light',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=70',
    x: 148,
    y: 86,
  },
  {
    id: 'kerala',
    name: 'Kerala',
    state: 'Kerala',
    tagline: 'Backwaters',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=70',
    x: 248,
    y: 236,
  },
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal',
    tagline: 'Alpine air',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=70',
    x: 268,
    y: 42,
  },
]

export const suggestedPlaces = places.filter((place) => place.id !== 'ahmedabad')

export const styleOptions = [
  'Adventure',
  'Relaxation',
  'Food',
  'Culture',
  'Nightlife',
  'Nature',
  'Luxury',
  'Budget',
  'Photography',
  'Shopping',
  'Beach',
]

export const defaultPlan: TripPlan = {
  origin: 'Ahmedabad',
  destinations: ['Mumbai', 'Goa'],
  startDate: '2026-10-15',
  endDate: '2026-10-21',
  adults: 2,
  children: 0,
  infants: 0,
  companion: 'Couple',
  styles: ['Adventure', 'Food', 'Beach', 'Photography'],
  accommodation: 'Premium',
  transport: 'Mixed',
  food: ['Local', 'Street Food'],
  intensity: 'Balanced',
  budget: 65000,
  brief: '',
}

export function routeCities(plan: TripPlan) {
  return [plan.origin, ...plan.destinations.filter((city) => city !== plan.origin)]
}

export function routeLabel(plan: TripPlan) {
  return routeCities(plan).join(' → ')
}

export function tripDuration(plan: TripPlan) {
  const nights = Math.max(0, differenceInCalendarDays(parseISO(plan.endDate), parseISO(plan.startDate)))
  return { nights, days: nights + 1 }
}

export function dateRangeLabel(plan: TripPlan) {
  return `${format(parseISO(plan.startDate), 'd MMM')} – ${format(parseISO(plan.endDate), 'd MMM yyyy')}`
}

export function styleSummary(styles: string[]) {
  const set = new Set(styles)
  if (set.has('Adventure') && (set.has('Food') || set.has('Beach')) && (set.has('Relaxation') || set.has('Photography'))) {
    return 'You prefer active days balanced with relaxed evenings.'
  }
  if (set.has('Relaxation') && set.has('Food')) {
    return 'Slow mornings, long lunches, and one memorable outing a day.'
  }
  if (set.has('Luxury')) {
    return 'I’ll keep the pace calm and the stays polished.'
  }
  if (set.has('Adventure') && set.has('Nature')) {
    return 'Outdoor days first, with recovery time built into the evenings.'
  }
  if (styles.length === 0) {
    return 'Pick a few moods and I’ll shape the days around them.'
  }
  return `I’ll lean into ${styles.slice(0, 3).join(', ').toLowerCase()} without locking you into a rigid schedule.`
}

export function budgetAllocation(budget: number) {
  const stay = Math.round(budget * 0.308)
  const transport = Math.round(budget * 0.231)
  const food = Math.round(budget * 0.123)
  const activities = Math.round(budget * 0.154)
  const local = Math.round(budget * 0.108)
  const buffer = Math.max(0, budget - stay - transport - food - activities - local)
  const recommended = Math.round(budget * 0.077 / 500) * 500 || 5000
  return [
    { name: 'Stay', value: stay, color: '#4529a8' },
    { name: 'Transport', value: transport, color: '#2563eb' },
    { name: 'Food', value: food, color: '#059669' },
    { name: 'Activities', value: activities, color: '#d97706' },
    { name: 'Local transport', value: local, color: '#7c3aed' },
    { name: 'Buffer', value: buffer, color: '#94a3b8' },
  ].map((row) => ({ ...row, recommended }))
}

export function parseBrief(text: string) {
  const lower = text.toLowerCase()
  // First check hardcoded places
  const found = places
    .filter((place) => lower.includes(place.name.toLowerCase()))
    .map((place) => place.name)
    .filter((name) => name !== 'Ahmedabad')
  // Common city aliases
  if ((lower.includes('bombay') || lower.includes('mumbai')) && !found.includes('Mumbai')) found.push('Mumbai')
  if (lower.includes('goa') && !found.includes('Goa')) found.push('Goa')
  // Free-text extraction: any Title-Case word(s) followed by common trip keywords, or comma-separated city lists
  const freeMatch = text.match(/(?:to|in|visit|from|→|->|,)\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/g)
  if (freeMatch) {
    freeMatch.forEach((raw) => {
      const city = raw.replace(/^(?:to|in|visit|from|→|->|,)\s*/i, '').trim()
      if (city.length > 2 && !found.includes(city) && city.toLowerCase() !== 'ahmedabad') {
        found.push(city)
      }
    })
  }
  // Also grab any initial Title-Case word(s) at start of text as the primary destination
  const startCity = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
  if (startCity && startCity[1].length > 2 && !found.includes(startCity[1]) && startCity[1].toLowerCase() !== 'ahmedabad') {
    found.unshift(startCity[1])
  }
  const dayMatch = lower.match(/(\d+)\s*-?\s*day/)
  const nightMatch = lower.match(/(\d+)\s*night/)
  const styles = styleOptions.filter((style) => lower.includes(style.toLowerCase()))
  if (lower.includes('relax')) styles.push('Relaxation')
  if (lower.includes('beach') || lower.includes('sea') || lower.includes('ocean')) styles.push('Beach')
  if (lower.includes('food') || lower.includes('eat') || lower.includes('cuisine')) styles.push('Food')
  if (lower.includes('adventure') || lower.includes('trek') || lower.includes('hike')) styles.push('Adventure')
  if (lower.includes('luxury') || lower.includes('premium') || lower.includes('resort')) styles.push('Luxury')
  if (lower.includes('nature') || lower.includes('forest') || lower.includes('wildlife')) styles.push('Nature')
  if (lower.includes('culture') || lower.includes('heritage') || lower.includes('temple')) styles.push('Culture')
  const days = dayMatch ? Number(dayMatch[1]) : nightMatch ? Number(nightMatch[1]) + 1 : undefined
  return {
    destinations: [...new Set(found)],
    days,
    styles: [...new Set(styles)],
  }
}

export function loadPlan(): TripPlan | null {
  const raw = localStorage.getItem(PLAN_KEY)
  if (!raw) return null
  try {
    return { ...defaultPlan, ...(JSON.parse(raw) as TripPlan) }
  } catch {
    return null
  }
}

export function persistPlan(plan: TripPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

/** Build day-by-day TripNode stubs from a TripPlan. */
export function generatePlanNodes(plan: TripPlan): TripNode[] {
  const { nights } = tripDuration(plan)
  const alloc = budgetAllocation(plan.budget)
  const stayBudget = alloc.find((a) => a.name === 'Stay')?.value ?? Math.round(plan.budget * 0.31)
  const transportBudget = alloc.find((a) => a.name === 'Transport')?.value ?? Math.round(plan.budget * 0.23)
  const foodBudget = alloc.find((a) => a.name === 'Food')?.value ?? Math.round(plan.budget * 0.12)
  const actBudget = alloc.find((a) => a.name === 'Activities')?.value ?? Math.round(plan.budget * 0.15)

  const nodes: TripNode[] = []
  const cities = routeCities(plan) // [origin, dest1, dest2 ...]
  const dests = cities.slice(1) // destinations (excluding origin)
  if (dests.length === 0) dests.push(cities[0])

  // Distribute nights across destinations evenly
  const nightsPerDest = Math.max(1, Math.floor(nights / dests.length))
  const transportCostPerLeg = dests.length > 0 ? Math.round(transportBudget / (dests.length + 1)) : transportBudget
  const stayPerNight = nights > 0 ? Math.round(stayBudget / nights) : stayBudget
  const foodPerDay = Math.round(foodBudget / Math.max(1, nights + 1))
  const actPerDay = Math.round(actBudget / Math.max(1, nights + 1))

  let dayIndex = 1
  const startDate = parseISO(plan.startDate)

  // Day 1: Departure from origin to first destination
  const firstDest = dests[0]
  const day1Date = format(startDate, 'yyyy-MM-dd')
  nodes.push({
    id: `n-${crypto.randomUUID().slice(0, 8)}`,
    day: 1,
    date: day1Date,
    city: plan.origin,
    title: `Depart ${plan.origin}`,
    time: '06:00',
    category: 'transport',
    status: 'upcoming',
    cost: Math.round(transportCostPerLeg * 0.3),
    notes: `${plan.transport === 'Mixed' ? 'Train/Flight' : plan.transport} from ${plan.origin} to ${firstDest}`,
  })
  
  nodes.push({
    id: `n-${crypto.randomUUID().slice(0, 8)}`,
    day: 1,
    date: day1Date,
    city: plan.origin,
    title: `Alternative travel to ${firstDest}`,
    time: '08:30',
    category: 'transport',
    status: 'alternative',
    cost: Math.round(transportCostPerLeg * 0.5),
    notes: `Alternative transit option to ${firstDest}`,
  })
  nodes.push({
    id: `n-${crypto.randomUUID().slice(0, 8)}`,
    day: 1,
    date: day1Date,
    city: firstDest,
    title: `Arrive ${firstDest}`,
    time: '12:00',
    category: 'transport',
    status: 'upcoming',
    cost: Math.round(transportCostPerLeg * 0.7),
    notes: `Arrival transfer · local cab to ${plan.accommodation.toLowerCase()} hotel`,
  })
  nodes.push({
    id: `n-${crypto.randomUUID().slice(0, 8)}`,
    day: 1,
    date: day1Date,
    city: firstDest,
    title: `Check-in — ${firstDest}`,
    time: '14:00',
    category: 'stay',
    status: 'upcoming',
    cost: stayPerNight,
    notes: `${plan.accommodation} hotel · ${nightsPerDest} nights in ${firstDest}`,
  })
  dayIndex = 2

  // Middle days per destination
  dests.forEach((dest, di) => {
    const daysInDest = di === dests.length - 1 ? Math.max(1, nights - (dests.length - 1) * nightsPerDest) : nightsPerDest
    for (let d = 0; d < daysInDest - (di < dests.length - 1 ? 1 : 0); d++) {
      const dateStr = format(addDays(startDate, dayIndex - 1), 'yyyy-MM-dd')
      const isLastDayHere = d === daysInDest - 2 && di < dests.length - 1
      nodes.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        day: dayIndex,
        date: dateStr,
        city: dest,
        title: isLastDayHere ? `${dest} — last full day` : `${dest} — Day ${dayIndex}`,
        time: '09:00',
        category: 'activity',
        status: 'upcoming',
        cost: actPerDay,
        notes: `${plan.styles.slice(0, 2).join(' & ')} experience in ${dest}`,
      })
      nodes.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        day: dayIndex,
        date: dateStr,
        city: dest,
        title: `Meals in ${dest}`,
        time: '13:00',
        category: 'food',
        status: 'upcoming',
        cost: foodPerDay,
        notes: plan.food.length ? `${plan.food.join(' / ')} dining` : 'Local cuisine',
      })
      dayIndex++
    }
    // Transit to next destination
    if (di < dests.length - 1) {
      const nextDest = dests[di + 1]
      const dateStr = format(addDays(startDate, dayIndex - 1), 'yyyy-MM-dd')
      nodes.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        day: dayIndex,
        date: dateStr,
        city: dest,
        title: `${dest} → ${nextDest}`,
        time: '09:00',
        category: 'transport',
        status: 'upcoming',
        cost: transportCostPerLeg,
        notes: `${plan.transport === 'Mixed' ? 'Train/Flight' : plan.transport} to ${nextDest}`,
      })
      nodes.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        day: dayIndex,
        date: dateStr,
        city: nextDest,
        title: `Check-in — ${nextDest}`,
        time: '15:00',
        category: 'stay',
        status: 'upcoming',
        cost: stayPerNight,
        notes: `${plan.accommodation} hotel · ${nightsPerDest} nights in ${nextDest}`,
      })
      dayIndex++
    }
  })

  // Final day: return home
  const lastDate = format(parseISO(plan.endDate), 'yyyy-MM-dd')
  const lastDest = dests[dests.length - 1]
  nodes.push({
    id: `n-${crypto.randomUUID().slice(0, 8)}`,
    day: nights + 1,
    date: lastDate,
    city: lastDest,
    title: `Return to ${plan.origin}`,
    time: '10:00',
    category: 'transport',
    status: 'upcoming',
    cost: transportCostPerLeg,
    notes: `Checkout and travel back to ${plan.origin}`,
  })

  return nodes
}

export function applyPlanToTrip(trip: Trip, plan: TripPlan): Trip {
  const cities = routeCities(plan)
  const westCoast = cities.includes('Mumbai') && cities.includes('Goa')
  const nodes = generatePlanNodes(plan)
  const spent = nodes.reduce((sum, node) => sum + node.cost, 0)
  return {
    ...trip,
    title: westCoast ? 'West Coast Circuit' : cities.slice(1).join(' · ') || trip.title,
    route: routeLabel(plan),
    startDate: plan.startDate,
    endDate: plan.endDate,
    adults: plan.adults,
    travelers: plan.adults + plan.children,
    budget: plan.budget,
    spent,
    travelStyle: plan.styles,
    accommodation: `${plan.accommodation} stay`,
    transport: plan.transport === 'Mixed' ? ['Train', 'Flight', 'Local Cab'] : [plan.transport],
    interests: plan.styles,
    status: 'ready',
    feasibility: 94,
    nodes,
  }
}

/**
 * Create a brand-new Trip entity from a TripPlan.
 * Every call generates a unique ID so multiple trips can coexist in the store.
 */
export function createTripFromPlan(plan: TripPlan): Trip {
  const cities = routeCities(plan)
  const westCoast = cities.includes('Mumbai') && cities.includes('Goa')
  const nodes = generatePlanNodes(plan)
  const spent = nodes.filter((n) => n.status !== 'alternative').reduce((sum, n) => sum + n.cost, 0)
  const originName = plan.origin
  const destNames = plan.destinations.filter((d) => d !== originName)
  const tripId = `trip-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`
  return {
    id: tripId,
    title: westCoast
      ? 'West Coast Circuit'
      : destNames.length > 0
        ? destNames.join(' · ')
        : originName,
    route: routeLabel(plan),
    origin: { id: originName.toLowerCase().replace(/\s+/g, '-'), city: originName, state: '', label: originName },
    destinations: destNames.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      city: name,
      state: '',
      label: name,
    })),
    startDate: plan.startDate,
    endDate: plan.endDate,
    adults: plan.adults,
    travelers: plan.adults + plan.children,
    budget: plan.budget,
    spent,
    status: 'ready',
    travelStyle: plan.styles,
    accommodation: `${plan.accommodation} stay`,
    transport: plan.transport === 'Mixed' ? ['Train', 'Flight', 'Local Cab'] : [plan.transport],
    interests: plan.styles,
    feasibility: 94,
    nodes,
    alternatives: [],
  }
}


