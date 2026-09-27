import { searchActivities, searchFlights, searchHotels, searchRestaurants, searchTrains } from './travelDataService'
import { aviationFlights, railBetween } from './liveApis'
import { openRouterChat, parseJsonObject } from './openrouter'
import type { TravelEntity } from './types'

export interface LivePlanNode {
  id: string
  day: number
  date: string
  title: string
  city: string
  time: string
  category: 'stay' | 'food' | 'activity' | 'transport' | 'free'
  status: 'upcoming' | 'alternative'
  cost: number
  notes: string
}

export interface LivePlanResult {
  title: string
  narrative: string
  feasibility: number
  nodes: LivePlanNode[]
  sources: string[]
  model?: string
}

function names(items: TravelEntity[], n = 5) {
  return items.slice(0, n).map((item) => ({
    name: item.name,
    price: item.price,
    rating: item.rating,
    location: item.location,
    description: item.description?.slice(0, 160),
  }))
}

function shiftDate(start: string, days: number) {
  const stamp = new Date(`${start}T00:00:00`)
  stamp.setDate(stamp.getDate() + days)
  return stamp.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  const a = new Date(`${start}T00:00:00`).getTime()
  const b = new Date(`${end}T00:00:00`).getTime()
  const nights = Math.max(0, Math.round((b - a) / 86400000))
  return { nights, days: nights + 1 }
}

function datesInRange(start: string, days: number) {
  return Array.from({ length: days }, (_, index) => shiftDate(start, index))
}

function cityForNight(dests: string[], nights: number, dayIndex: number) {
  if (!dests.length) return 'Goa'
  const nightsPer = Math.max(1, Math.floor(nights / dests.length))
  const slot = Math.min(dests.length - 1, Math.floor(Math.max(0, dayIndex - 1) / nightsPer))
  return dests[slot] ?? dests[dests.length - 1]
}

function pick<T>(items: T[], index: number): T | undefined {
  if (!items.length) return undefined
  return items[index % items.length]
}

function emptySearch() {
  return { items: [] as TravelEntity[], meta: { configured: false, engine: '', query: '', latencyMs: 0, resultCount: 0, cache: 'miss' as const } }
}

function normalizeTime(value: string | undefined, fallback: string) {
  const raw = (value ?? '').trim()
  if (/^\d{1,2}:\d{2}/.test(raw)) return raw.replace(/^(\d):/, '0$1')
  return fallback
}

function stitchFromCatalog(input: {
  origin: string
  destinations: string[]
  startDate: string
  endDate: string
  budget: number
  accommodation: string
  transport: string
  hotels: Record<string, TravelEntity[]>
  food: Record<string, TravelEntity[]>
  activities: Record<string, TravelEntity[]>
  flights: TravelEntity[]
  trains: TravelEntity[]
  airNote?: string
}): LivePlanNode[] {
  const dests = input.destinations.filter(Boolean)
  const { nights, days } = daysBetween(input.startDate, input.endDate)
  const dates = datesInRange(input.startDate, days)
  const stayPerNight = nights > 0 ? Math.round(input.budget * 0.3 / nights) : 6000
  const nodes: LivePlanNode[] = []
  let seq = 0
  const push = (node: Omit<LivePlanNode, 'id' | 'status'>) => {
    nodes.push({
      ...node,
      id: `live-${seq++}-${node.city}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      status: 'upcoming',
    })
  }

  dates.forEach((date, index) => {
    const day = index + 1
    const city = cityForNight(dests, nights, day)
    const prev = index === 0 ? input.origin : cityForNight(dests, nights, day - 1)
    const hotel = pick(input.hotels[city] ?? [], index)
    const lunch = pick(input.food[city] ?? [], index)
    const dinner = pick(input.food[city] ?? [], index + 1)
    const morning = pick(input.activities[city] ?? [], index)
    const afternoon = pick(input.activities[city] ?? [], index + 1)

    if (day === 1) {
      push({
        day,
        date,
        title: input.flights[0]?.name || input.trains[0]?.name || `${input.origin} → ${city}`,
        city: input.origin,
        time: '07:20 – 10:40',
        category: 'transport',
        cost: input.flights[0]?.price ?? input.trains[0]?.price ?? 6200,
        notes: input.airNote || `${input.transport} departure · retrieved live`,
      })
      push({
        day,
        date,
        title: hotel?.name ? `Check-in · ${hotel.name}` : `Check-in · ${input.accommodation} stay, ${city}`,
        city,
        time: '13:30 – 14:30',
        category: 'stay',
        cost: hotel?.price ?? stayPerNight,
        notes: hotel?.location || hotel?.description || `${input.accommodation} stay · first night`,
      })
      push({
        day,
        date,
        title: lunch?.name ? `Lunch · ${lunch.name}` : `Local lunch in ${city}`,
        city,
        time: '14:45 – 16:00',
        category: 'food',
        cost: lunch?.price && lunch.price < 4000 ? lunch.price : 1600,
        notes: lunch?.description || 'First meal after arrival',
      })
      push({
        day,
        date,
        title: afternoon?.name || `Evening walk in ${city}`,
        city,
        time: '17:30 – 20:00',
        category: 'activity',
        cost: 900,
        notes: afternoon?.description || 'Settle-in window with a light outing',
      })
      return
    }

    if (day === days) {
      push({
        day,
        date,
        title: morning?.name || `Last morning in ${city}`,
        city,
        time: '08:30 – 10:30',
        category: 'activity',
        cost: 700,
        notes: morning?.description || 'Checkout buffer after breakfast',
      })
      push({
        day,
        date,
        title: `Return ${city} → ${input.origin}`,
        city,
        time: '12:20 – 16:10',
        category: 'transport',
        cost: input.flights[1]?.price ?? input.flights[0]?.price ?? 6400,
        notes: 'Return hop · live transport search',
      })
      return
    }

    if (prev !== city) {
      push({
        day,
        date,
        title: `${prev} → ${city}`,
        city: prev,
        time: '08:40 – 12:20',
        category: 'transport',
        cost: 5400,
        notes: `${input.transport} hop to the next city`,
      })
      push({
        day,
        date,
        title: hotel?.name ? `Check-in · ${hotel.name}` : `Check-in · ${city}`,
        city,
        time: '13:30 – 14:30',
        category: 'stay',
        cost: hotel?.price ?? stayPerNight,
        notes: hotel?.location || 'Arrival stay',
      })
    } else {
      push({
        day,
        date,
        title: morning?.name || `${city} morning`,
        city,
        time: '08:30 – 11:30',
        category: 'activity',
        cost: morning?.price && morning.price < 8000 ? morning.price : 2200,
        notes: morning?.description || 'Morning outing',
      })
    }

    push({
      day,
      date,
      title: lunch?.name ? `Lunch · ${lunch.name}` : `Lunch in ${city}`,
      city,
      time: '12:45 – 14:15',
      category: 'food',
      cost: 1500,
      notes: lunch?.description || 'Midday meal',
    })
    push({
      day,
      date,
      title: afternoon?.name || `${city} afternoon`,
      city,
      time: '15:30 – 18:00',
      category: 'activity',
      cost: 1800,
      notes: afternoon?.description || 'Afternoon slot',
    })
    push({
      day,
      date,
      title: dinner?.name ? `Dinner · ${dinner.name}` : `Dinner in ${city}`,
      city,
      time: '19:30 – 21:15',
      category: 'food',
      cost: 1900,
      notes: dinner?.description || 'Evening meal',
    })
  })

  return nodes
}

export async function buildLivePlan(input: {
  origin: string
  destinations: string[]
  startDate: string
  endDate: string
  adults: number
  budget: number
  styles: string[]
  transport: string
  accommodation: string
  brief?: string
}): Promise<LivePlanResult> {
  const dests = [...new Set(input.destinations.filter(Boolean))].slice(0, 3)
  if (!dests.length) dests.push('Goa')
  const { days } = daysBetween(input.startDate, input.endDate || input.startDate)
  const midDate = shiftDate(input.startDate, Math.max(1, Math.floor(days / 2)))
  const style = input.styles[0] || 'activities'

  const hotelResults = await Promise.all(
    dests.map((city) =>
      searchHotels({
        destination: city,
        checkIn: input.startDate,
        checkOut: input.endDate,
        adults: input.adults,
        maxPrice: input.budget,
      }),
    ),
  )
  const foodResults = await Promise.all(dests.map((city) => searchRestaurants(city)))
  const actResults = await Promise.all(dests.map((city) => searchActivities(city, style)))
  const [firstFlight, nextFlight, trains, airPulse, railPulse] = await Promise.all([
    searchFlights({ origin: input.origin, destination: dests[0], date: input.startDate, adults: input.adults }),
    dests[1]
      ? searchFlights({ origin: dests[0], destination: dests[1], date: midDate, adults: input.adults })
      : Promise.resolve(emptySearch()),
    searchTrains(input.origin, dests[0]),
    aviationFlights(input.origin, dests[0]),
    railBetween(input.origin, dests[0]),
  ])

  const hotels: Record<string, TravelEntity[]> = {}
  const food: Record<string, TravelEntity[]> = {}
  const activities: Record<string, TravelEntity[]> = {}
  dests.forEach((city, index) => {
    hotels[city] = hotelResults[index]?.items ?? []
    food[city] = foodResults[index]?.items ?? []
    activities[city] = actResults[index]?.items ?? []
  })

  const sources = [
    hotelResults.some((row) => row.meta.configured) ? 'SerpApi hotels' : null,
    firstFlight.meta.configured ? 'SerpApi flights' : null,
    trains.meta.configured ? 'SerpApi trains' : null,
    airPulse.length ? 'AviationStack' : null,
    railPulse.length ? 'RailRadar' : null,
    'OpenRouter gpt-4o-mini',
  ].filter(Boolean) as string[]

  const catalog = {
    plan: { ...input, destinations: dests, days },
    perCity: dests.map((city) => ({
      city,
      hotels: names(hotels[city] ?? []),
      restaurants: names(food[city] ?? []),
      activities: names(activities[city] ?? []),
    })),
    flights: names([...firstFlight.items, ...nextFlight.items]),
    trains: names(trains.items),
    aviationstack: airPulse,
    railradar: railPulse,
  }

  const destLine = dests.join(', ')
  const ai = await openRouterChat({
    system: `You are TripFlow’s live itinerary composer for Indian travel.

HARD RULES
- plan.destinations are the only cities allowed besides origin and retrieved day-trip towns next to them.
- Never mention Mumbai, Goa, or any city that is not origin, a listed destination, or a retrieved nearby town (example: Gulmarg/Pahalgam only if destination is Srinagar/Kashmir).
- Use ONLY hotel, restaurant, flight, train, and activity names from the catalog JSON. Do not invent venue names.
- Every calendar day from startDate through endDate inclusive MUST appear.
- Each node needs: day, date (YYYY-MM-DD), title, city (mappable), time ("HH:MM – HH:MM"), category stay|food|activity|transport|free, status "upcoming", cost INR integer, notes (why this hop / what the traveler does).
- Times on a day must be in order and not overlap.

DAY STRUCTURE (follow this sequence)
- Day 1: (1) outbound transport from origin — flight first if catalog.flights exist, else train, else cab; (2) hotel check-in in the first destination; (3) lunch or rest; (4) one arrival-evening place (lake, bazaar, garden, promenade from catalog).
- Middle days: morning landmark → lunch → afternoon landmark or day trip → dinner. If a long day-trip (Gulmarg, Pahalgam, Munnar, Agra) use that town as node.city so the map moves.
- Last day: morning / checkout → return transport to origin.

MAP
- city on each node is the pin the map uses. Travel nodes use the arrival city. Return flight uses origin.

Return JSON only:
{title,narrative,feasibility,nodes:[{day,date,title,city,time,category,status,cost,notes}]}
Narrative: 2 sentences naming ${input.origin} → ${destLine} and the live sources used.`,
    user: JSON.stringify(catalog),
    maxTokens: 3200,
    temperature: 0.2,
  })

  const parsed = ai ? parseJsonObject<LivePlanResult>(ai.content) : null
  const rawNodes = (parsed?.nodes ?? [])
    .filter((node) => node.title && node.city && node.category)
    .map((node, index) => ({
      ...node,
      id: `live-${index}-${node.city}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      status: node.status === 'alternative' ? 'alternative' : 'upcoming',
      cost: Number(node.cost) || 0,
      time: normalizeTime(node.time, '10:00'),
      date: node.date || input.startDate,
      day: Number(node.day) || 1,
      notes: node.notes || 'Live candidate from TripFlow search',
    }))
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))

  const coveredDays = new Set(rawNodes.map((node) => node.day))
  const missingDays = Array.from({ length: days }, (_, index) => index + 1).filter((day) => !coveredDays.has(day))
  const stitched = stitchFromCatalog({
    origin: input.origin,
    destinations: dests,
    startDate: input.startDate,
    endDate: input.endDate,
    budget: input.budget,
    accommodation: input.accommodation,
    transport: input.transport,
    hotels,
    food,
    activities,
    flights: [...firstFlight.items, ...nextFlight.items],
    trains: trains.items,
    airNote: airPulse[0] ? `${airPulse[0].flight ?? 'Flight'} · ${airPulse[0].status ?? 'scheduled'}` : undefined,
  })

  const nodes =
    rawNodes.length >= days * 3 && missingDays.length === 0
      ? rawNodes
      : [...rawNodes, ...stitched.filter((node) => !coveredDays.has(node.day))].sort(
          (a, b) => a.day - b.day || a.time.localeCompare(b.time),
        )

  return {
    title: parsed?.title || `${input.origin} · ${dests.join(' · ')}`,
    narrative:
      parsed?.narrative ||
      'Day-by-day circuit stitched from retrieved hotels, meals, activities, and transport.',
    feasibility: Math.max(40, Math.min(96, Number(parsed?.feasibility) || 86)),
    nodes,
    sources,
    model: ai?.model,
  }
}
