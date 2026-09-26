import { formatINR } from '@/lib/cn'
import type { Trip, TripNode } from '@/types'

export type PathMode = 'flight' | 'train'
export type CanvasView = 'flow' | 'map' | 'timeline'

export const FLIGHT_COST = 4500
export const TRAIN_COST = 2100

export function nodeDuration(node: TripNode) {
  if (node.category === 'stay' && node.notes.includes('2 nights')) return '2 nights'
  if (node.category === 'stay' && node.notes.includes('4 nights')) return '4 nights'
  if (node.time.includes('–')) {
    const [from, to] = node.time.split('–').map((part) => part.trim())
    return `${from}–${to}`
  }
  if (node.category === 'transport') return 'in transit'
  if (node.category === 'food') return '75 min'
  if (node.category === 'activity') return '3 hours'
  return 'Open'
}

export function displayCost(node: TripNode, path: PathMode) {
  if (node.id === 'n7') {
    const stockFlight = node.title.includes('IndiGo') || node.title.includes('6E 5121')
    if (!stockFlight) return node.cost
    return path === 'train' ? TRAIN_COST : FLIGHT_COST
  }
  return node.cost
}

export function predictedBudgetCopy(budget: number, planned: number) {
  const left = budget - planned
  if (left >= 0) return `Likely to finish ${formatINR(left)} under budget`
  return `Predicted ${formatINR(Math.abs(left))} over budget`
}

export function plannedSpend(trip: Trip, path: PathMode) {
  return trip.nodes.reduce((sum, node) => sum + displayCost(node, path), 0)
}

export function fallbackNodes(trip: Trip): TripNode[] {
  if (trip.nodes.length) return trip.nodes
  return [
    {
      id: `${trip.id}-a`,
      day: 1,
      date: trip.startDate,
      title: `Depart ${trip.origin.city}`,
      city: trip.origin.city,
      time: '08:00',
      category: 'transport',
      status: 'upcoming',
      cost: 4200,
      notes: 'Seeded so the canvas is never empty.',
    },
    {
      id: `${trip.id}-b`,
      day: 1,
      date: trip.startDate,
      title: `${trip.destinations[0]?.city ?? 'Destination'} stay`,
      city: trip.destinations[0]?.city ?? trip.origin.city,
      time: '14:00',
      category: 'stay',
      status: 'upcoming',
      cost: 8000,
      notes: 'Generate a full itinerary to replace this seed graph.',
    },
    {
      id: `${trip.id}-c`,
      day: 2,
      date: trip.endDate,
      title: 'Return home',
      city: trip.origin.city,
      time: '16:00',
      category: 'transport',
      status: 'upcoming',
      cost: 4200,
      notes: 'Close the circuit.',
    },
  ]
}
