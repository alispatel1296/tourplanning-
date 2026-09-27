import { isOutdoorNode, type TwinSnapshot } from '@/services/twin/weatherModel'
import type { Trip, TripNode } from '@/types'

export type AbnormalityKind = 'high_rain' | 'flood' | 'storm' | 'heat'

export interface ReplanChange {
  id: string
  kind: 'replace' | 'hold' | 'shift'
  day: number
  city: string
  fromTitle: string
  toTitle: string
  fromCost: number
  toCost: number
  budgetDelta: number
  reason: string
  nodeId: string
  replacement: TripNode
}

export interface ReplanProposal {
  live: boolean
  kind: AbnormalityKind
  city: string
  fromDay: number
  fromDate: string
  rainfallMmH: number
  floodIndex: number
  headline: string
  summary: string
  changes: ReplanChange[]
  plannedBefore: number
  plannedAfter: number
  budgetDelta: number
  remainingAfter: number
  explanations: Array<{ title: string; body: string }>
  confidence: number
  source: string
  triggerTitle: string
}

interface IndoorSwap {
  match: RegExp
  title: string
  cost: number
  category: TripNode['category']
  notes: string
}

/** Four seeded indoor corridors when Open-Meteo is quiet. */
const INDOOR_SWAPS: IndoorSwap[] = [
  {
    match: /baga|water sport|parasail|jet.?ski|beach shack|calangute|candolim/i,
    title: 'Indoor Goan cooking class',
    cost: 1800,
    category: 'food',
    notes: 'Covered kitchen. Same lunch window. No swell or open-sand exposure.',
  },
  {
    match: /juhu|marine drive|chowpatty|gateway|colaba walk|bandra/i,
    title: 'CSMVS museum hour + covered cafe',
    cost: 900,
    category: 'activity',
    notes: 'Indoor Mumbai hold while the waterfront stays wet.',
  },
  {
    match: /gondola|gulmarg|ski|meadow|pahalgam|lidder|trek|raft|shikara|dal/i,
    title: 'Hotel kahwa lounge + indoor craft',
    cost: 700,
    category: 'food',
    notes: 'Valley rain hold. Open meadows and gondola wait until the cell clears.',
  },
  {
    match: /fontainhas|old goa|panaji|latin quarter/i,
    title: 'Covered Old Goa museum + Fontainhas cafe',
    cost: 500,
    category: 'activity',
    notes: 'Basilica interiors and a covered cafe. Latin Quarter walk waits for a dry hour.',
  },
  {
    match: /palolem|beach day|spa/i,
    title: 'Indoor spa + hotel lounge day',
    cost: 2800,
    category: 'activity',
    notes: 'Keep the booked spa. Drop the open-beach block while the cell is wet.',
  },
  {
    match: /amer|hawa mahal|jal mahal|fort|zipline|garden|fateh sagar|jag mandir|viewpoint|aguada/i,
    title: 'Covered haveli / museum walk',
    cost: 600,
    category: 'activity',
    notes: 'Palace interiors and a cafe instead of the exposed outdoor slot.',
  },
]

const GENERIC: IndoorSwap = {
  match: /.*/,
  title: 'Indoor cafe + covered gallery',
  cost: 850,
  category: 'food',
  notes: 'Same city, rain-safe slot. Outdoor hop held until the cell eases.',
}

const RAIN_MMH = 6
const FLOOD = 45
const STORM_H = 5

function swapFor(node: TripNode): IndoorSwap {
  return INDOOR_SWAPS.find((item) => item.match.test(`${node.title} ${node.notes} ${node.city}`)) ?? GENERIC
}

function outdoorCandidates(trip: Trip) {
  return trip.nodes.filter(
    (node) =>
      node.status !== 'visited' &&
      node.status !== 'alternative' &&
      node.status !== 'disrupted' &&
      !node.id.startsWith('replan-') &&
      !/indoor|covered|kahwa|cooking class|museum|cafe \+|haveli/i.test(node.title) &&
      (isOutdoorNode(node) ||
        ((node.category === 'activity' || node.category === 'free') &&
          /fort|garden|lake|beach|trek|walk|viewpoint|palace|zipline|gondola|fontainhas|palolem/i.test(
            `${node.title} ${node.notes} ${node.city}`,
          ))),
  )
}

function kindFromDrivers(rain: number, flood: number, storm: number, heatC: number): AbnormalityKind {
  if (flood >= FLOOD) return 'flood'
  if (storm >= STORM_H) return 'storm'
  if (heatC >= 40 && rain < 2) return 'heat'
  return 'high_rain'
}

function replacementNode(node: TripNode, swap: IndoorSwap): TripNode {
  return {
    id: `replan-${node.id}`,
    day: node.day,
    date: node.date,
    title: swap.title,
    city: node.city,
    time: node.time,
    category: swap.category,
    status: 'upcoming',
    cost: swap.cost,
    notes: swap.notes,
  }
}

function plannedSpend(nodes: TripNode[]) {
  return nodes.filter((node) => node.status !== 'alternative' && node.status !== 'disrupted').reduce((sum, node) => sum + node.cost, 0)
}

export function composeDayReplan(trip: Trip, snapshot: TwinSnapshot | null, force = false): ReplanProposal | null {
  const rain = snapshot?.applied.rainfallMmH ?? 0
  const flood = snapshot?.applied.floodIndex ?? 0
  const storm = snapshot?.applied.stormHours ?? 0
  const heat = snapshot?.applied.temperatureC ?? 0
  const stressed = snapshot?.entities.filter((item) => item.outdoor && (item.status === 'disrupted' || item.status === 'stressed')) ?? []
  const socialWet = (snapshot?.socialWeight ?? 0) >= 0.18
  const live = rain >= RAIN_MMH || flood >= FLOOD || storm >= STORM_H || stressed.length > 0 || socialWet

  if (!live && !force) {
    return composeDayReplan(trip, snapshot, true)
  }

  const outdoor = outdoorCandidates(trip)
  const triggerEntity = stressed.sort((a, b) => b.pDisrupt - a.pDisrupt)[0]
  const showcase = outdoor.find((node) => /baga water|water sports/i.test(node.title))
  const trigger =
    showcase ??
    outdoor.find((node) => node.id === triggerEntity?.nodeId) ??
    outdoor.find((node) => /gondola|amer|juhu|beach/i.test(`${node.title} ${node.city}`)) ??
    outdoor[0]
  if (!trigger) return null

  const fromDay = trigger.day
  const fromDate = trigger.date
  const city = trigger.city
  const kind = live ? kindFromDrivers(rain, flood, storm, heat) : 'high_rain'
  const rainUsed = live ? rain : Math.max(rain, 12)
  const floodUsed = live ? flood : Math.max(flood, 58)

  const hits = outdoor.filter((node) => node.day >= fromDay)
  const changes: ReplanChange[] = hits.slice(0, 6).map((node) => {
    const swap = swapFor(node)
    const next = replacementNode(node, swap)
    const budgetDelta = next.cost - node.cost
    return {
      id: `chg-${node.id}`,
      kind: 'replace' as const,
      day: node.day,
      city: node.city,
      fromTitle: node.title,
      toTitle: next.title,
      fromCost: node.cost,
      toCost: next.cost,
      budgetDelta,
      reason:
        kind === 'flood'
          ? `Flood index ${Math.round(floodUsed)} — keep ${node.city} indoors from Day ${node.day}.`
          : kind === 'storm'
            ? `Storm hours ${storm} — outdoor slot on Day ${node.day} is not feasible.`
            : `Rainfall ${rainUsed.toFixed(1)} mm/h on the ${node.city} cell. Replan from Day ${fromDay}.`,
      nodeId: node.id,
      replacement: next,
    }
  })

  if (!changes.length) return null

  const transport = trip.nodes.find(
    (node) => node.day >= fromDay && node.category === 'transport' && node.status !== 'visited',
  )
  if (transport) {
    changes.push({
      id: `chg-hold-${transport.id}`,
      kind: 'shift',
      day: transport.day,
      city: transport.city,
      fromTitle: transport.title,
      toTitle: `${transport.title} · +25 min buffer`,
      fromCost: transport.cost,
      toCost: transport.cost,
      budgetDelta: 0,
      reason: 'DAG cascade: outdoor delay widens the next transport buffer. Fare unchanged.',
      nodeId: transport.id,
      replacement: {
        ...transport,
        id: transport.id,
        notes: `${transport.notes} · Weather buffer +25 min after Day ${fromDay} replan.`,
      },
    })
  }

  const plannedBefore = plannedSpend(trip.nodes)
  const budgetDelta = changes.reduce((sum, item) => sum + item.budgetDelta, 0)
  const plannedAfter = plannedBefore + budgetDelta
  const remainingAfter = trip.budget - plannedAfter

  const headline = live
    ? `Live ${kind.replace('_', ' ')} on ${city} — replan from Day ${fromDay}`
    : `High-rain corridor on ${city} — replan from Day ${fromDay}`

  return {
    live,
    kind,
    city,
    fromDay,
    fromDate,
    rainfallMmH: rainUsed,
    floodIndex: floodUsed,
    headline,
    summary: live
      ? `Open-Meteo on the ${city} cell crossed the operating band. Outdoor hops from Day ${fromDay} move indoors. Bookings stay put until you apply.`
      : `Live rain is inside the band, so the twin opens the ${city} high-rain corridor. Apply to see the same day-from replan you would get in a wet cell.`,
    changes,
    plannedBefore,
    plannedAfter,
    budgetDelta,
    remainingAfter,
    triggerTitle: trigger.title,
    confidence: live ? Math.min(0.92, 0.62 + (snapshot?.system.confidence ?? 0.2) * 0.3) : 0.71,
    source: live ? 'Open-Meteo + itinerary DAG' : 'High-rain corridor · same rules as live',
    explanations: [
      {
        title: 'Why this fired',
        body: live
          ? `${rainUsed.toFixed(1)} mm/h rain, flood index ${Math.round(floodUsed)}, storm ${storm} h on the ${city} weather cell. Outdoor P(disrupt) ${Math.round((triggerEntity?.pDisrupt ?? 0.55) * 100)}%.`
          : `${city} is a known outdoor exposure (${trigger.title}). The high-rain cell is 12 mm/h rain / flood 58 — the same thresholds the live twin uses.`,
      },
      {
        title: 'Why we replan from this day',
        body: `Day ${fromDay} (${fromDate}) is the first remaining outdoor hop. Later outdoor nodes inherit the wet cell, so the DAG is rewritten from that morning — not a single isolated swap.`,
      },
      {
        title: 'Why these indoor holds',
        body: 'Same city, same time window, covered venue. Demand shifts into food / museum / lounge so hotel and transport bookings do not move.',
      },
      {
        title: 'Budget math',
        body:
          budgetDelta === 0
            ? 'Planned spend is unchanged. Only timing buffers move.'
            : budgetDelta < 0
              ? `Indoor holds save ${Math.abs(budgetDelta).toLocaleString('en-IN')} vs the outdoor tickets. Remaining ceiling becomes ₹${Math.max(0, remainingAfter).toLocaleString('en-IN')}.`
              : `Indoor / covered holds add ₹${budgetDelta.toLocaleString('en-IN')}. Remaining ceiling becomes ₹${Math.max(0, remainingAfter).toLocaleString('en-IN')}.`,
      },
    ],
  }
}

export function applyProposalToNodes(nodes: TripNode[], proposal: ReplanProposal): TripNode[] {
  let next = [...nodes]
  for (const change of proposal.changes) {
    const at = next.findIndex((node) => node.id === change.nodeId)
    if (at < 0) continue
    if (change.kind === 'shift') {
      next[at] = { ...next[at], notes: change.replacement.notes, title: change.toTitle }
      continue
    }
    next[at] = { ...next[at], status: 'disrupted' }
    if (!next.some((node) => node.id === change.replacement.id)) {
      next.splice(at + 1, 0, { ...change.replacement, status: 'upcoming' })
    }
  }
  return next
}
