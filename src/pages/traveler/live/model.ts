import type { Trip, TripNode } from '@/types'

export const LIVE_REMAINING_START = 9200
export const BEACH_NODE_ID = 'n10'
export const INDOOR_ALT_ID = 'n-live-indoor'
export const LIVE_DAYS = 7

export const indoorAlt = (anchor: TripNode): TripNode => ({
  id: INDOOR_ALT_ID,
  day: anchor.day,
  date: anchor.date,
  title: 'Indoor food experience · covered cafe',
  city: anchor.city,
  time: '11:00 – 13:00',
  category: 'food',
  status: 'alternative',
  cost: 1800,
  notes: 'Rain-safe swap for Baga water sports. Same lunch window, no swell exposure.',
})

export function seedLiveNodes(nodes: TripNode[]): TripNode[] {
  if (!nodes.length) return nodes
  const progressed = nodes.some(
    (node) => node.status === 'visited' || node.status === 'active' || node.status === 'disrupted',
  )
  if (progressed) return nodes
  const beachAt = nodes.findIndex((node) => node.id === BEACH_NODE_ID)
  const cut = beachAt >= 0 ? beachAt : Math.max(0, Math.floor(nodes.length * 0.55))
  return nodes.map((node, index) => {
    if (index < cut) return { ...node, status: 'visited' as const }
    if (index === cut) return { ...node, status: 'active' as const }
    return { ...node, status: 'upcoming' as const }
  })
}

export function nextActionLabel(node: TripNode | undefined) {
  if (!node) return 'Circuit complete'
  if (node.id === BEACH_NODE_ID || node.title.toLowerCase().includes('baga') || node.title.toLowerCase().includes('beach')) {
    return 'Beach Activity'
  }
  return node.title
}

export function clockFor(node: TripNode | undefined) {
  if (!node) return '10:30 AM'
  if (node.id === BEACH_NODE_ID || node.status === 'active') {
    const hour = node.time.slice(0, 5)
    if (hour === '09:30') return '10:30 AM'
    return toClock(node.time)
  }
  return toClock(node.time)
}

function toClock(time: string) {
  const raw = time.split('–')[0]?.trim() ?? time
  const [h, m] = raw.split(':').map(Number)
  if (!Number.isFinite(h)) return raw
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

export function liveDay(trip: Trip) {
  const current = trip.nodes.find((node) => node.status === 'active') ?? trip.nodes.find((node) => node.status === 'disrupted')
  return current?.day ?? 4
}

export function remainingBudget(trip: Trip) {
  return Math.max(0, trip.budget - trip.spent)
}
