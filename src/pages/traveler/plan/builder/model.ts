import { hopDate, hopsFor, SOFT_DELTA, type HopOption, type PlanHop } from '@/pages/traveler/plan/builder/catalog'
import type { Alternative, Trip, TripNode } from '@/types'
import type { TripPlan } from '@/types/plan'

export const BUILDER_KEY = 'tf-plan-builder'

const liveHopOptions: Record<string, HopOption[]> = {}
const liveHopCopy: Record<string, { narrator?: string; question?: string }> = {}

export function setLiveHopOverlay(hopId: string, options: HopOption[], copy?: { narrator?: string; question?: string }) {
  liveHopOptions[hopId] = options
  if (copy) liveHopCopy[hopId] = copy
}

export function hopsWithLive(plan: TripPlan): PlanHop[] {
  return hopsFor(plan).map((hop) => {
    const live = liveHopOptions[hop.id]
    const copy = liveHopCopy[hop.id]
    return {
      ...hop,
      narrator: copy?.narrator ?? hop.narrator,
      question: copy?.question ?? hop.question,
      options: live?.length ? live : hop.options,
    }
  })
}

export interface HopPick {
  primaryId: string | null
  alternativeIds: string[]
}

export interface BuilderState {
  hopIndex: number
  picks: Record<string, HopPick>
}

export function emptyBuilder(plan: TripPlan): BuilderState {
  const picks: Record<string, HopPick> = {}
  hopsWithLive(plan).forEach((hop) => {
    picks[hop.id] = { primaryId: null, alternativeIds: [] }
  })
  return { hopIndex: 0, picks }
}

export function loadBuilder(plan: TripPlan): BuilderState {
  const fallback = emptyBuilder(plan)
  const raw = localStorage.getItem(BUILDER_KEY)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as BuilderState
    return {
      hopIndex: Math.min(parsed.hopIndex ?? 0, Math.max(0, hopsWithLive(plan).length - 1)),
      picks: { ...fallback.picks, ...parsed.picks },
    }
  } catch {
    return fallback
  }
}

export function persistBuilder(state: BuilderState) {
  localStorage.setItem(BUILDER_KEY, JSON.stringify(state))
}

export function clearBuilder() {
  localStorage.removeItem(BUILDER_KEY)
}

export function optionById(hop: PlanHop, id: string | null) {
  if (!id) return null
  return hop.options.find((option) => option.id === id) ?? null
}

export function recommendedOf(hop: PlanHop) {
  return hop.options.find((option) => option.tag === 'recommended') ?? hop.options[0]
}

export function cheapestOf(hop: PlanHop) {
  if (!hop.options.length) return hop.options[0]
  return hop.options.reduce((best, option) => (option.price < best.price ? option : best), hop.options[0])
}

export function deltaVs(option: HopOption, baseline: HopOption | null) {
  if (!baseline) return option.price
  return option.price - baseline.price
}

export function deltaTone(delta: number) {
  return delta <= SOFT_DELTA ? 'green' : 'red'
}

export function primarySpend(plan: TripPlan, picks: Record<string, HopPick>) {
  return hopsWithLive(plan).reduce((sum, hop) => {
    const option = optionById(hop, picks[hop.id]?.primaryId ?? null)
    return sum + (option?.price ?? 0)
  }, 0)
}

export function recommendedSpend(plan: TripPlan) {
  return hopsWithLive(plan).reduce((sum, hop) => {
    const rec = recommendedOf(hop)
    return sum + (rec?.price ?? 0)
  }, 0)
}

export function hopComplete(pick: HopPick | undefined) {
  return Boolean(pick?.primaryId)
}

export function applyBuilderToTrip(trip: Trip, plan: TripPlan, picks: Record<string, HopPick>): Trip {
  const hops = hopsWithLive(plan)
  const nodes: TripNode[] = hops.map((hop) => {
    const option = optionById(hop, picks[hop.id]?.primaryId ?? null) ?? recommendedOf(hop)
    return {
      id: hop.nodeId ?? `build-${hop.id}`,
      day: hop.day,
      date: hopDate(plan, hop),
      title: option.name,
      city: hop.city,
      time: option.time,
      category: hop.category,
      status: 'upcoming',
      cost: option.price,
      notes: option.summary,
    }
  })
  const alternatives: Alternative[] = hops.flatMap((hop) => {
    const primary = optionById(hop, picks[hop.id]?.primaryId ?? null) ?? recommendedOf(hop)
    return (picks[hop.id]?.alternativeIds ?? [])
      .map((id) => optionById(hop, id))
      .filter((option): option is HopOption => option !== null)
      .filter((option) => option.id !== primary.id)
      .map((option) => ({
        id: option.id,
        title: option.name,
        reason: option.summary,
        impact: `${deltaLabel(option.price - primary.price)} vs ${primary.name}`,
        extraCost: option.price - primary.price,
        risk: option.price - primary.price > SOFT_DELTA ? 'medium' : 'low',
      }))
  })
  const spent = nodes.reduce((sum, node) => sum + node.cost, 0)
  return {
    ...trip,
    title: trip.id === 'trip-amd-goa' ? 'West Coast Circuit' : trip.title,
    route: `${plan.origin} → ${plan.destinations.join(' → ')}`,
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
    feasibility: spent <= plan.budget ? 94 : 78,
    nodes,
    alternatives,
  }
}

export function deltaLabel(delta: number) {
  if (delta === 0) return 'No change'
  const abs = `₹${Math.abs(delta).toLocaleString('en-IN')}`
  return delta > 0 ? `+${abs}` : `−${abs}`
}
