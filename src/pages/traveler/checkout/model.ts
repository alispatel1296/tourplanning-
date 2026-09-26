import { format, parseISO } from 'date-fns'
import { displayCost, type PathMode } from '@/pages/traveler/flow/model'
import type { Trip, TripNode } from '@/types'

/** Derive quote values dynamically from the trip's actual budget and nodes. */
export function computeQuote(trip: Trip) {
  const nodes = trip.nodes.filter(n => n.status !== 'alternative')
  const budget = trip.budget
  const hotelCost = nodes.filter((n) => n.category === 'stay').reduce((s, n) => s + n.cost, 0)
  const transportCost = nodes.filter((n) => n.category === 'transport').reduce((s, n) => s + n.cost, 0)
  const actCost = nodes.filter((n) => n.category === 'activity' || n.category === 'free').reduce((s, n) => s + n.cost, 0)
  const foodCost = nodes.filter((n) => n.category === 'food').reduce((s, n) => s + n.cost, 0)
  // If no nodes yet, fall back to budget allocation
  const hasNodes = nodes.length > 0
  const hotels = hasNodes && hotelCost > 0 ? hotelCost : Math.round(budget * 0.31)
  const transport = hasNodes && transportCost > 0 ? transportCost : Math.round(budget * 0.23)
  const activities = hasNodes && actCost > 0 ? actCost : Math.round(budget * 0.15)
  const food = hasNodes && foodCost > 0 ? foodCost : Math.round(budget * 0.12)
  const local = Math.round(budget * 0.08)
  const subtotal = hotels + transport + activities + food + local
  const taxes = Math.round(subtotal * 0.05)
  const total = subtotal + taxes
  return { hotels, transport, activities, food, local, taxes, subtotal, total }
}

// Legacy constants kept for backward compat (based on default ₹65,000 budget)
export const QUOTE = {
  hotels: 20000,
  transport: 15000,
  activities: 10000,
  food: 8000,
  local: 7000,
  taxes: 3000,
} as const

export const SUBTOTAL = QUOTE.hotels + QUOTE.transport + QUOTE.activities + QUOTE.food + QUOTE.local
export const TOTAL = SUBTOTAL + QUOTE.taxes

export interface QuoteLine {
  id: string
  title: string
  detail: string
  amount: number
}

export interface QuoteSection {
  id: 'transport' | 'hotels' | 'activities' | 'food' | 'local'
  title: string
  total: number
  lines: QuoteLine[]
}

export function checkoutDates(start: string, end: string) {
  const from = parseISO(start)
  const to = parseISO(end)
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `${format(from, 'd')}–${format(to, 'd MMM')}`
  }
  return `${format(from, 'd MMM')} – ${format(to, 'd MMM')}`
}

export function quoteSections(trip: Trip, path: PathMode = 'flight'): QuoteSection[] {
  const nodes = trip.nodes.filter(n => n.status !== 'alternative')
  const q = computeQuote(trip)
  const hotels = nodes.filter((node) => node.category === 'stay')
  const hops = nodes.filter((node) => node.category === 'transport')
  const activities = nodes.filter((node) => node.category === 'activity' || node.category === 'free')
  const food = nodes.filter((node) => node.category === 'food')

  // Build local transport stub lines from the route
  const route = trip.route ?? ''
  const legs = route.split(' → ').filter(Boolean)
  const localLines: QuoteLine[] = legs.length > 1
    ? legs.map((city, i) => ({
        id: `lt-${i}`,
        title: `${city} — local transfers`,
        detail: `Cabs & auto-rickshaws · Day ${i + 1}`,
        amount: Math.round(q.local / Math.max(1, legs.length)),
      }))
    : [{ id: 'lt-1', title: 'Local transport', detail: 'Cabs & local transfers', amount: q.local }]

  return [
    {
      id: 'transport',
      title: 'Transport',
      total: q.transport,
      lines: allocate(hops, q.transport, path, (node) => `${node.time} · ${node.city}`),
    },
    {
      id: 'hotels',
      title: 'Hotels',
      total: q.hotels,
      lines: allocate(hotels, q.hotels, path, (node) => `${node.city} · ${stayNights(node)}`),
    },
    {
      id: 'activities',
      title: 'Activities',
      total: q.activities,
      lines: allocate(activities, q.activities, path, (node) => `${node.city} · ${node.time}`),
    },
    {
      id: 'food',
      title: 'Food experiences',
      total: q.food,
      lines: allocate(food, q.food, path, (node) => `${node.city} · ${node.notes}`),
    },
    {
      id: 'local',
      title: 'Local transport',
      total: q.local,
      lines: localLines,
    },
  ]
}

function stayNights(node: TripNode) {
  if (node.notes.includes('4 nights')) return '4 nights'
  if (node.notes.includes('2 nights')) return '2 nights'
  return node.time
}

function allocate(nodes: TripNode[], total: number, path: PathMode, detail: (node: TripNode) => string): QuoteLine[] {
  if (!nodes.length) {
    return [{ id: 'empty', title: 'No holds on this category', detail: 'Generate an itinerary to fill this section.', amount: 0 }]
  }
  const weights = nodes.map((node) => Math.max(displayCost(node, path), 400))
  const sum = weights.reduce((acc, value) => acc + value, 0)
  const lines = nodes.map((node, index) => ({
    id: node.id,
    title: node.title,
    detail: detail(node),
    amount: Math.round((total * weights[index]) / sum),
  }))
  const drift = total - lines.reduce((acc, line) => acc + line.amount, 0)
  lines[lines.length - 1].amount += drift
  return lines
}

export function itineraryText(trip: Trip, bookingId: string, sections: QuoteSection[]) {
  const dynamicTotal = computeQuote(trip).total
  const lines = [
    'TripFlow AI · Booking confirmation (demo)',
    `Booking ID: ${bookingId}`,
    `Trip: ${trip.route}`,
    `Dates: ${checkoutDates(trip.startDate, trip.endDate)}`,
    `Travelers: ${trip.adults} adults`,
    '',
  ]
  for (const section of sections) {
    lines.push(section.title.toUpperCase())
    for (const line of section.lines) {
      lines.push(`  • ${line.title} — ₹${line.amount.toLocaleString('en-IN')}`)
    }
    lines.push('')
  }
  lines.push(`Total (incl. taxes): ₹${dynamicTotal.toLocaleString('en-IN')}`)
  lines.push('Payment was simulated. No charge was made.')
  return lines.join('\n')
}


