import type { TwinSnapshot } from '@/services/twin/weatherModel'
import type { Trip, TripNode } from '@/types'

export type EmergencyLevel = 'clear' | 'watch' | 'warning' | 'critical'

export interface PredictiveFramework {
  id: string
  name: string
  family: string
  reading: string
  value: string
  detail: string
}

export interface EmergencyForecast {
  level: EmergencyLevel
  headline: string
  pEmergency: number
  pDelay: number
  leadMinutes: number
  cascadeMinutes: number
  confidence: number
  uncertainty: number
  triggerTitle: string
  triggerCity: string
  triggerNodeId?: string
  expectedCost: number
  actions: string[]
  frameworks: PredictiveFramework[]
  generatedAt: string
}

const LEVEL_COPY: Record<EmergencyLevel, string> = {
  clear: 'No emergency predicted in the next operating window.',
  watch: 'Watch band — a weather or delay shock can still cascade.',
  warning: 'Emergency likely on an outdoor or transit hop. Stage a yellow path.',
  critical: 'High-probability emergency. Apply the indoor / hold reroute now.',
}

function minutesUntil(node?: TripNode) {
  if (!node?.time) return 90
  const start = node.time.split('–')[0]?.trim() ?? node.time
  const [h, m] = start.split(':').map(Number)
  if (!Number.isFinite(h)) return 90
  const now = new Date()
  const target = new Date()
  target.setHours(h, m || 0, 0, 0)
  const diff = Math.round((target.getTime() - now.getTime()) / 60000)
  return diff >= 0 ? diff : diff + 24 * 60
}

export function forecastEmergency(trip: Trip, snapshot: TwinSnapshot): EmergencyForecast {
  const ranked = [...snapshot.entities].sort((a, b) => b.pDisrupt - a.pDisrupt || b.delayMinutes - a.delayMinutes)
  const trigger = ranked[0]
  const triggerNode = trip.nodes.find((node) => node.id === trigger?.nodeId)
  const pEmergency = Math.min(0.97, Math.max(0.04, (trigger?.pDisrupt ?? 0.08) * (1 + snapshot.socialWeight * 0.35)))
  const pDelay = Math.min(0.95, trigger?.pDelay ?? snapshot.system.delayMinutes / 90)
  const level: EmergencyLevel =
    pEmergency >= 0.62 || trigger?.status === 'disrupted'
      ? 'critical'
      : pEmergency >= 0.4 || trigger?.status === 'stressed'
        ? 'warning'
        : pEmergency >= 0.22
          ? 'watch'
          : 'clear'

  const leadMinutes = minutesUntil(triggerNode)
  const cascadeMinutes = snapshot.system.delayMinutes
  const expectedCost = Math.round(800 + pEmergency * 2400 + (level === 'critical' ? 900 : 0))

  const actions =
    level === 'clear'
      ? ['Keep the green path. Twin will refresh if rainfall or flood index jumps.']
      : [
          `Hold ${trigger?.title ?? 'the next outdoor hop'} as the yellow candidate.`,
          'Shift demand into an indoor meal or covered activity in the same city.',
          'Widen the next transport buffer by the predicted cascade delay.',
          'Do not change booked inventory until the traveler accepts the reroute.',
        ]

  const frameworks: PredictiveFramework[] = [
    {
      id: 'nowcast',
      name: 'Hazard nowcast',
      family: 'Open-Meteo short-range meteorology',
      reading: `${snapshot.applied.rainfallMmH.toFixed(1)} mm/h · flood ${Math.round(snapshot.applied.floodIndex)}`,
      value: `${Math.round(snapshot.applied.precipProb)}% precip`,
      detail: 'Rain, wind, storm hours, and a composite flood index on the active weather cell.',
    },
    {
      id: 'cox',
      name: 'Outdoor hazard model',
      family: 'Cox-style risk on activity nodes',
      reading: trigger ? `${Math.round(trigger.pDisrupt * 100)}% P(disrupt)` : 'No outdoor slot',
      value: trigger?.status ?? 'stable',
      detail: 'Survival-style shock for beaches, treks, and open-air slots given rain, heat, and flood.',
    },
    {
      id: 'dag',
      name: 'Itinerary DAG cascade',
      family: 'Delay propagation on the trip graph',
      reading: `${cascadeMinutes} min system delay · ${snapshot.links.length} edges`,
      value: `${Math.round(pDelay * 100)}% P(delay)`,
      detail: 'Each hop inherits delay from the previous transport and outdoor node — not a single isolated alert.',
    },
    {
      id: 'bayes',
      name: 'Bayesian social update',
      family: 'SerpApi news / search likelihood',
      reading: `Social weight ${Math.round(snapshot.socialWeight * 100)}%`,
      value: snapshot.socialWeight > 0.15 ? 'Corroborated' : 'Quiet',
      detail: 'Public flood, storm, and cancel language updates the prior from the weather cell.',
    },
    {
      id: 'counterfactual',
      name: 'Counterfactual what-if',
      family: 'do-intervention on rainfall / flood',
      reading: snapshot.whatIf ? 'Levers engaged' : 'Observed world',
      value: snapshot.whatIf ? 'Twin only' : 'Live',
      detail: 'What-if changes the twin, not bookings, until you stage a live reroute.',
    },
    {
      id: 'conformal',
      name: 'Confidence band',
      family: 'Uncertainty around the emergency score',
      reading: `±${Math.round(snapshot.system.uncertainty * 100)} pts`,
      value: `${Math.round(snapshot.system.confidence * 100)}% conf.`,
      detail: 'Wider bands when social feeds are thin or the weather cell is still loading.',
    },
  ]

  return {
    level,
    headline: LEVEL_COPY[level],
    pEmergency,
    pDelay,
    leadMinutes,
    cascadeMinutes,
    confidence: snapshot.system.confidence,
    uncertainty: snapshot.system.uncertainty,
    triggerTitle: trigger?.title ?? 'Next hop',
    triggerCity: trigger?.city ?? trip.destinations[0]?.city ?? trip.origin.city,
    triggerNodeId: trigger?.nodeId,
    expectedCost,
    actions,
    frameworks,
    generatedAt: snapshot.generatedAt,
  }
}
