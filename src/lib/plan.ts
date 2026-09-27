import type { Place, TripPlan } from '@/types/plan'
import type { Trip, TripNode } from '@/types'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

export const PLAN_KEY = 'tf-plan'

function p(id: string, name: string, state: string, tagline: string, image: string, x: number, y: number): Place {
  return { id, name, state, tagline, image, x, y }
}

export const places: Place[] = [
  p('ahmedabad', 'Ahmedabad', 'Gujarat', 'Home city', 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=70', 92, 168),
  p('mumbai', 'Mumbai', 'Maharashtra', 'Coastal nights', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=70', 168, 132),
  p('goa', 'Goa', 'Goa', 'Beaches & spice', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=70', 196, 214),
  p('jaipur', 'Jaipur', 'Rajasthan', 'Palaces & light', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=70', 148, 86),
  p('kerala', 'Kerala', 'Kerala', 'Backwaters', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=70', 248, 236),
  p('manali', 'Manali', 'Himachal', 'Alpine air', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=70', 268, 42),
  p('shimla', 'Shimla', 'Himachal', 'Ridge & cedar', 'https://images.unsplash.com/photo-1597074866923-dc058de18517?auto=format&fit=crop&w=800&q=70', 250, 52),
  p('delhi', 'Delhi', 'Delhi', 'Capitals & bazaars', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=70', 180, 70),
  p('agra', 'Agra', 'Uttar Pradesh', 'Taj mornings', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=70', 200, 88),
  p('udaipur', 'Udaipur', 'Rajasthan', 'Lakes & havelis', 'https://images.unsplash.com/photo-1599661046827-dacff0c0bd5c?auto=format&fit=crop&w=800&q=70', 120, 120),
  p('jodhpur', 'Jodhpur', 'Rajasthan', 'Blue city', 'https://images.unsplash.com/photo-1477583967329-4f26d53d18d4?auto=format&fit=crop&w=800&q=70', 110, 100),
  p('jaisalmer', 'Jaisalmer', 'Rajasthan', 'Golden fort', 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=800&q=70', 80, 110),
  p('varanasi', 'Varanasi', 'Uttar Pradesh', 'Ghats at dawn', 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=70', 230, 110),
  p('rishikesh', 'Rishikesh', 'Uttarakhand', 'Ganga & yoga', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=70', 210, 48),
  p('amritsar', 'Amritsar', 'Punjab', 'Golden Temple', 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=70', 160, 36),
  p('srinagar', 'Srinagar', 'Kashmir', 'Dal Lake', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=70', 190, 18),
  p('kashmir', 'Kashmir', 'Kashmir', 'Valley lakes', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=70', 192, 16),
  p('gulmarg', 'Gulmarg', 'Kashmir', 'Meadow gondola', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=70', 184, 14),
  p('pahalgam', 'Pahalgam', 'Kashmir', 'Lidder valley', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=70', 198, 20),
  p('leh', 'Leh', 'Ladakh', 'High desert', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=70', 240, 12),
  p('dharamshala', 'Dharamshala', 'Himachal', 'Hill monastery', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=70', 220, 38),
  p('chandigarh', 'Chandigarh', 'Punjab', 'Garden city', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=70', 188, 50),
  p('kochi', 'Kochi', 'Kerala', 'Fort & nets', 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=70', 236, 250),
  p('munnar', 'Munnar', 'Kerala', 'Tea ridges', 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=70', 252, 242),
  p('alleppey', 'Alleppey', 'Kerala', 'Houseboats', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=70', 240, 246),
  p('bengaluru', 'Bengaluru', 'Karnataka', 'Garden tech', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=70', 220, 220),
  p('hampi', 'Hampi', 'Karnataka', 'Boulder ruins', 'https://images.unsplash.com/photo-1600100397676-0c25363d389d?auto=format&fit=crop&w=800&q=70', 200, 210),
  p('mysuru', 'Mysuru', 'Karnataka', 'Palace lights', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=70', 216, 230),
  p('chennai', 'Chennai', 'Tamil Nadu', 'Marina city', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=70', 268, 228),
  p('pondicherry', 'Pondicherry', 'Puducherry', 'French quarter', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=70', 276, 236),
  p('hyderabad', 'Hyderabad', 'Telangana', 'Charminar & biryani', 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=800&q=70', 210, 190),
  p('kolkata', 'Kolkata', 'West Bengal', 'Howrah evenings', 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=70', 300, 140),
  p('darjeeling', 'Darjeeling', 'West Bengal', 'Tea & toy train', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=70', 310, 80),
  p('gangtok', 'Gangtok', 'Sikkim', 'Himalayan capital', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=70', 320, 70),
  p('andaman', 'Andaman', 'Andaman', 'Island reefs', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=70', 360, 230),
  p('pune', 'Pune', 'Maharashtra', 'Deccan cafes', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=70', 176, 150),
  p('ooty', 'Ooty', 'Tamil Nadu', 'Nilgiri mist', 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=70', 240, 232),
  p('coorg', 'Coorg', 'Karnataka', 'Coffee hills', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=70', 228, 238),
  p('gokarna', 'Gokarna', 'Karnataka', 'Temple beach', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=70', 188, 228),
  p('varkala', 'Varkala', 'Kerala', 'Cliff coast', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=70', 244, 260),
  p('kodaikanal', 'Kodaikanal', 'Tamil Nadu', 'Lake hills', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=70', 256, 240),
  p('mount-abu', 'Mount Abu', 'Rajasthan', 'Aravalli lake', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=70', 128, 140),
  p('bhuj', 'Bhuj', 'Gujarat', 'Rann gateway', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=70', 60, 160),
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

/** Type these two in Plan — live compose returns a full day-wise circuit. */
export const DEMO_PLAN_CITIES = ['Jaipur', 'Udaipur'] as const
export const DEMO_PLAN_BRIEF = 'Jaipur and Udaipur, 6 days from Ahmedabad'

export const defaultPlan: TripPlan = {
  origin: 'Ahmedabad',
  destinations: [...DEMO_PLAN_CITIES],
  startDate: '2026-10-22',
  endDate: '2026-10-27',
  adults: 2,
  children: 0,
  infants: 0,
  companion: 'Couple',
  styles: ['Culture', 'Food', 'Photography'],
  accommodation: 'Premium',
  transport: 'Mixed',
  food: ['Local', 'Street Food'],
  intensity: 'Balanced',
  budget: 72000,
  brief: DEMO_PLAN_BRIEF,
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

const knownCities: Record<string, string> = {
  ahmedabad: 'Ahmedabad',
  amdavad: 'Ahmedabad',
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  goa: 'Goa',
  jaipur: 'Jaipur',
  udaipur: 'Udaipur',
  jodhpur: 'Jodhpur',
  jaisalmer: 'Jaisalmer',
  agra: 'Agra',
  kerala: 'Kerala',
  kochi: 'Kochi',
  manali: 'Manali',
  shimla: 'Shimla',
  leh: 'Leh',
  ladakh: 'Leh',
  dharamshala: 'Dharamshala',
  rishikesh: 'Rishikesh',
  haridwar: 'Haridwar',
  varanasi: 'Varanasi',
  pondicherry: 'Pondicherry',
  puducherry: 'Pondicherry',
  darjeeling: 'Darjeeling',
  gangtok: 'Gangtok',
  munnar: 'Munnar',
  alleppey: 'Alleppey',
  alappuzha: 'Alleppey',
  hampi: 'Hampi',
  delhi: 'Delhi',
  chandigarh: 'Chandigarh',
  srinagar: 'Srinagar',
  kashmir: 'Srinagar',
  amritsar: 'Amritsar',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  mysuru: 'Mysuru',
  mysore: 'Mysuru',
  chennai: 'Chennai',
  hyderabad: 'Hyderabad',
  kolkata: 'Kolkata',
  calcutta: 'Kolkata',
  pune: 'Pune',
  ooty: 'Ooty',
  udhagamandalam: 'Ooty',
  coorg: 'Coorg',
  kodagu: 'Coorg',
  gokarna: 'Gokarna',
  varkala: 'Varkala',
  kodaikanal: 'Kodaikanal',
  'mount abu': 'Mount Abu',
  bhuj: 'Bhuj',
  kutch: 'Bhuj',
  andaman: 'Andaman',
  'port blair': 'Andaman',
}

export function parseBrief(text: string) {
  const lower = text.toLowerCase()
  const found = places
    .filter((place) => lower.includes(place.name.toLowerCase()))
    .map((place) => place.name)
    .filter((name) => name !== 'Ahmedabad')
  for (const [key, name] of Object.entries(knownCities)) {
    if (lower.includes(key) && !found.includes(name) && name !== 'Ahmedabad') found.push(name)
  }
  // Free-text extraction: any Title-Case word(s) followed by common trip keywords, or comma-separated city lists
  const freeMatch = text.match(/(?:to|in|visit|from|→|->|,)\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/g)
  if (freeMatch) {
    freeMatch.forEach((raw) => {
      const city = raw.replace(/^(?:to|in|visit|from|→|->|,)\s*/i, '').trim()
      const mapped = knownCities[city.toLowerCase()] ?? city
      if (mapped.length > 2 && !found.includes(mapped) && mapped.toLowerCase() !== 'ahmedabad') {
        found.push(mapped)
      }
    })
  }
  // Also grab any initial Title-Case word(s) at start of text as the primary destination
  const startCity = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
  if (startCity) {
    const mapped = knownCities[startCity[1].toLowerCase()] ?? startCity[1]
    if (mapped.length > 2 && !found.includes(mapped) && mapped.toLowerCase() !== 'ahmedabad') {
      found.unshift(mapped)
    }
  }
  const dayMatch = lower.match(/(\d+)\s*-?\s*day/)
  const nightMatch = lower.match(/(\d+)\s*night/)
  const fromMatch = lower.match(/\b(?:from|i(?:'m| am) (?:in|at))\s+([a-z][a-z\s]{1,24}?)(?=\s+(?:to|and|for|with|under|budget|\d|,|$))/)
  const originKey = fromMatch?.[1]?.trim().replace(/\s+/g, ' ')
  const origin =
    originKey && knownCities[originKey]
      ? knownCities[originKey]
      : originKey
        ? originKey.replace(/\b\w/g, (ch) => ch.toUpperCase())
        : undefined
  const kBudget = lower.match(/(?:budget|under|₹|rs\.?)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*k\b/) ?? lower.match(/\b(\d+(?:\.\d+)?)\s*k\b/)
  const rawBudget = lower.match(/(?:budget|under|₹|rs\.?)\s*(?:is|=|:)?\s*₹?\s*(\d[\d,]{2,})/)
  const budget = kBudget ? Math.round(Number(kBudget[1]) * 1000) : rawBudget ? Number(rawBudget[1].replace(/,/g, '')) : undefined
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
    origin,
    destinations: [...new Set(found)].filter((name) => !origin || name.toLowerCase() !== origin.toLowerCase()).slice(0, 2),
    days,
    budget,
    styles: [...new Set(styles)],
  }
}

export function loadPlan(): TripPlan | null {
  const raw = localStorage.getItem(PLAN_KEY)
  if (!raw) return null
  try {
    const stored = JSON.parse(raw) as TripPlan
    const dests = stored.destinations ?? []
    const leftoverWestCoast =
      dests.length === 2 && dests.includes('Mumbai') && dests.includes('Goa') && !stored.brief?.trim()
    if (leftoverWestCoast) return { ...defaultPlan }
    return {
      ...defaultPlan,
      ...stored,
      destinations: dests.length ? dests.slice(0, 2) : [...DEMO_PLAN_CITIES],
    }
  } catch {
    return null
  }
}

export function persistPlan(plan: TripPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

function nid() {
  return `n-${crypto.randomUUID().slice(0, 8)}`
}

function cityOnDay(dests: string[], nights: number, day: number) {
  const nightsPer = Math.max(1, Math.floor(nights / dests.length))
  return dests[Math.min(dests.length - 1, Math.floor(Math.max(0, day - 1) / nightsPer))]
}

/** Timed day-by-day circuit. Live search later replaces titles with retrieved venues. */
export function generatePlanNodes(plan: TripPlan): TripNode[] {
  const { nights, days } = tripDuration(plan)
  const alloc = budgetAllocation(plan.budget)
  const stayBudget = alloc.find((a) => a.name === 'Stay')?.value ?? Math.round(plan.budget * 0.31)
  const transportBudget = alloc.find((a) => a.name === 'Transport')?.value ?? Math.round(plan.budget * 0.23)
  const foodBudget = alloc.find((a) => a.name === 'Food')?.value ?? Math.round(plan.budget * 0.12)
  const actBudget = alloc.find((a) => a.name === 'Activities')?.value ?? Math.round(plan.budget * 0.15)
  const dests = routeCities(plan).slice(1)
  if (!dests.length) dests.push(plan.origin)
  const stayPerNight = nights > 0 ? Math.round(stayBudget / nights) : stayBudget
  const transportCostPerLeg = Math.round(transportBudget / Math.max(1, dests.length + 1))
  const foodPerMeal = Math.round(foodBudget / Math.max(1, days * 2))
  const actPerSlot = Math.round(actBudget / Math.max(1, days * 2))
  const style = plan.styles.slice(0, 2).join(' & ') || 'local'
  const foodNote = plan.food.length ? plan.food.join(' / ') : 'Local cuisine'
  const start = parseISO(plan.startDate)
  const nodes: TripNode[] = []

  for (let day = 1; day <= days; day++) {
    const date = format(addDays(start, day - 1), 'yyyy-MM-dd')
    const city = cityOnDay(dests, nights, day)
    const prev = day === 1 ? plan.origin : cityOnDay(dests, nights, day - 1)
    const hop = prev !== city

    if (day === 1) {
      nodes.push(
        {
          id: nid(),
          day,
          date,
          city: plan.origin,
          title: `${plan.transport === 'Mixed' ? 'Flight / train' : plan.transport} ${plan.origin} → ${city}`,
          time: '07:20 – 10:50',
          category: 'transport',
          status: 'upcoming',
          cost: transportCostPerLeg,
          notes: `Depart ${plan.origin}. Live search will lock the carrier.`,
        },
        {
          id: nid(),
          day,
          date,
          city,
          title: `Airport / station transfer · ${city}`,
          time: '11:10 – 12:20',
          category: 'transport',
          status: 'upcoming',
          cost: 900,
          notes: 'Cab to the stay with a 40-minute buffer.',
        },
        {
          id: nid(),
          day,
          date,
          city,
          title: `Check-in · ${plan.accommodation} stay, ${city}`,
          time: '13:30 – 14:30',
          category: 'stay',
          status: 'upcoming',
          cost: stayPerNight,
          notes: `${nights} nights on this circuit · ${plan.accommodation}`,
        },
        {
          id: nid(),
          day,
          date,
          city,
          title: `Lunch in ${city}`,
          time: '14:45 – 16:00',
          category: 'food',
          status: 'upcoming',
          cost: foodPerMeal,
          notes: foodNote,
        },
        {
          id: nid(),
          day,
          date,
          city,
          title: `${style} evening in ${city}`,
          time: '17:30 – 20:30',
          category: 'activity',
          status: 'upcoming',
          cost: actPerSlot,
          notes: 'Settle-in outing after the hop.',
        },
      )
      continue
    }

    if (day === days) {
      nodes.push(
        {
          id: nid(),
          day,
          date,
          city,
          title: `Breakfast + checkout · ${city}`,
          time: '08:00 – 10:00',
          category: 'stay',
          status: 'upcoming',
          cost: 0,
          notes: 'Bags down by 10:00. Keep the boarding pass offline.',
        },
        {
          id: nid(),
          day,
          date,
          city,
          title: `Last walk / cafe in ${city}`,
          time: '10:15 – 11:30',
          category: 'activity',
          status: 'upcoming',
          cost: Math.round(actPerSlot * 0.4),
          notes: 'Short window before the return hop.',
        },
        {
          id: nid(),
          day,
          date,
          city,
          title: `Return ${city} → ${plan.origin}`,
          time: '12:40 – 16:20',
          category: 'transport',
          status: 'upcoming',
          cost: transportCostPerLeg,
          notes: `${plan.transport === 'Mixed' ? 'Flight / train' : plan.transport} home.`,
        },
      )
      continue
    }

    if (hop) {
      nodes.push(
        {
          id: nid(),
          day,
          date,
          city: prev,
          title: `${prev} → ${city}`,
          time: '08:40 – 12:10',
          category: 'transport',
          status: 'upcoming',
          cost: transportCostPerLeg,
          notes: `${plan.transport === 'Mixed' ? 'Flight / train' : plan.transport} to the next city.`,
        },
        {
          id: nid(),
          day,
          date,
          city,
          title: `Check-in · ${city}`,
          time: '13:20 – 14:20',
          category: 'stay',
          status: 'upcoming',
          cost: stayPerNight,
          notes: `${plan.accommodation} stay`,
        },
      )
    } else {
      nodes.push({
        id: nid(),
        day,
        date,
        city,
        title: `${style} morning · ${city}`,
        time: '08:30 – 11:30',
        category: 'activity',
        status: 'upcoming',
        cost: actPerSlot,
        notes: 'Morning slot before the heat / crowds.',
      })
    }

    nodes.push(
      {
        id: nid(),
        day,
        date,
        city,
        title: `Lunch in ${city}`,
        time: '12:45 – 14:15',
        category: 'food',
        status: 'upcoming',
        cost: foodPerMeal,
        notes: foodNote,
      },
      {
        id: nid(),
        day,
        date,
        city,
        title: `${city} afternoon`,
        time: '15:30 – 18:00',
        category: 'activity',
        status: 'upcoming',
        cost: actPerSlot,
        notes: hop ? 'First afternoon after the hop.' : 'Second outing of the day.',
      },
      {
        id: nid(),
        day,
        date,
        city,
        title: `Dinner in ${city}`,
        time: '19:30 – 21:15',
        category: 'food',
        status: 'upcoming',
        cost: foodPerMeal,
        notes: foodNote,
      },
    )
  }

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

const CIRCUIT_TODAY = '2026-09-27'

export function stampCircuitProgress(nodes: TripNode[]): TripNode[] {
  let activeSet = false
  return nodes.map((node) => {
    if (node.status === 'alternative') return node
    if (node.date < CIRCUIT_TODAY) return { ...node, status: 'visited' as const }
    if (node.date === CIRCUIT_TODAY && !activeSet) {
      activeSet = true
      return { ...node, status: 'active' as const }
    }
    return { ...node, status: 'upcoming' as const }
  })
}

export function applyLivePlanToTrip(
  trip: Trip,
  live: { title?: string; feasibility?: number; nodes: Array<Partial<TripNode> & Pick<TripNode, 'title' | 'category'>> },
): Trip {
  const mapped: TripNode[] = live.nodes.map((node, index) => ({
    id: node.id || `live-${index}-${(node.city || trip.origin.city).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    day: Number(node.day) || 1,
    date: node.date || trip.startDate,
    title: node.title,
    city: node.city || trip.origin.city,
    time: node.time || '10:00',
    category: node.category,
    status: node.status === 'alternative' ? 'alternative' : 'upcoming',
    cost: Number(node.cost) || 0,
    notes: node.notes || 'Live candidate from TripFlow search',
    lat: node.lat,
    lng: node.lng,
    placeId: node.placeId,
  }))
  const nodes = trip.status === 'live' || trip.status === 'completed' ? stampCircuitProgress(mapped) : mapped
  const spent = nodes
    .filter((node) => node.status === 'visited' || node.status === 'active')
    .reduce((sum, node) => sum + node.cost, 0)
  return {
    ...trip,
    title: live.title || trip.title,
    feasibility: Math.max(40, Math.min(96, Number(live.feasibility) || trip.feasibility)),
    nodes: nodes.length ? nodes : trip.nodes,
    spent: nodes.length ? spent : trip.spent,
    status: trip.status === 'live' ? 'live' : trip.status === 'completed' ? 'completed' : 'ready',
  }
}


