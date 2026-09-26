import { demoConflicts, primaryTripNodes } from '@/data/demo'
import type { Conflict, Trip, TripNode } from '@/types'

export type DisruptionPhase = 'idle' | 'staged' | 'accepted' | 'approved'

export interface LiveMirror {
  nodes: TripNode[]
  spent: number
  disruption: DisruptionPhase
  tripStatus: Trip['status']
}

const KEY = 'tf-live-mirror'

export function readLiveMirror(): LiveMirror {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    return { nodes: primaryTripNodes, spent: 55800, disruption: 'idle', tripStatus: 'ready' }
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LiveMirror>
    return {
      nodes: parsed.nodes?.length ? parsed.nodes : primaryTripNodes,
      spent: parsed.spent ?? 55800,
      disruption: parsed.disruption ?? 'idle',
      tripStatus: parsed.tripStatus ?? 'ready',
    }
  } catch {
    return { nodes: primaryTripNodes, spent: 55800, disruption: 'idle', tripStatus: 'ready' }
  }
}

export function writeLiveMirror(patch: Partial<LiveMirror>) {
  const current = readLiveMirror()
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }))
}

export function aaravAlert() {
  const { disruption } = readLiveMirror()
  if (disruption === 'approved') return ''
  if (disruption === 'accepted') return 'AI reroute pending'
  if (disruption === 'staged') return 'Weather Alert'
  return 'Weather Alert'
}

export function overlayConflict(conflict: Conflict): Conflict {
  if (conflict.id !== 'cf-2') return conflict
  const { disruption } = readLiveMirror()
  if (disruption === 'approved') {
    return {
      ...conflict,
      title: 'Baga swell — AI change approved',
      description:
        'Desk confirmed Aarav Shah’s indoor food swap. Beach stays red as history; cooking class is the green live path. Impact ₹400.',
      state: 'resolved',
      severity: 'low',
    }
  }
  if (disruption === 'accepted') {
    return {
      ...conflict,
      title: 'Baga swell — traveler accepted indoor swap',
      description:
        'Aarav Shah accepted Beach activity → Cooking class. Rain risk exceeded threshold. Impact ₹400. Approve to lock the desk path.',
      state: 'open',
      severity: 'high',
    }
  }
  if (disruption === 'staged') {
    return {
      ...conflict,
      title: 'Baga sea swell advisory',
      description: 'IMD swell on Baga. Beach node is red. Indoor food alternative is staged in yellow on the same live file.',
      state: 'open',
      severity: 'high',
    }
  }
  return demoConflicts.find((item) => item.id === 'cf-2') ?? conflict
}

export function hydratePrimaryTrip(trip: Trip): Trip {
  const live = readLiveMirror()
  return { ...trip, nodes: live.nodes, spent: live.spent, status: live.tripStatus }
}

export function aaravNotes() {
  const { disruption } = readLiveMirror()
  if (disruption === 'approved') return 'Indoor food is desk-confirmed after the Baga swell.'
  if (disruption === 'accepted') return 'Traveler accepted Beach → Cooking class. Desk approval still open.'
  if (disruption === 'staged') return 'Baga beach is red. Indoor food alternative is staged on the live path.'
  return 'Live on Day 4. Baga swell is the open field risk.'
}
