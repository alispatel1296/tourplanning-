import { getCurrentWeather } from '@/services/weather/weather'
import { searchPlaces } from '@/services/places/places'
import { rankCandidates, type AIRecommendation } from '@/services/ai/ai'
import { calculateFeasibility, type TwinStatus } from '@/services/twin/feasibility'
import type { TripNode } from '@/types'

export type DisruptionKind = 'weather' | 'transport' | 'closure' | 'road' | 'deviation' | 'simulation'

export interface DisruptionSignal {
  kind: DisruptionKind
  title: string
  body: string
  nodeId?: string
  live: boolean
}

export interface DisruptionProposal {
  signal: DisruptionSignal
  affectedNode?: TripNode
  feasibility: TwinStatus
  recommendation: AIRecommendation
  alternatives: string[]
}

const RAIN_THRESHOLD = 55

export async function detectWeatherSignal(
  lat: number,
  lng: number,
  outdoorNode?: TripNode,
): Promise<DisruptionSignal | null> {
  const weather = await getCurrentWeather(lat, lng)
  const rainy = weather.precipitationProbability >= RAIN_THRESHOLD || weather.weatherCode >= 61
  if (!rainy) return null
  const when = outdoorNode?.time ? ` during your ${outdoorNode.time} activity` : ''
  return {
    kind: 'weather',
    title: 'Weather Alert',
    body: `${weather.condition} · ${weather.precipitationProbability}% precipitation expected${when}.`,
    nodeId: outdoorNode?.id,
    live: true,
  }
}

export async function runDisruptionPipeline(
  signal: DisruptionSignal,
  nodes: TripNode[],
): Promise<DisruptionProposal> {
  const affected = nodes.find((node) => node.id === signal.nodeId) ?? nodes.find((node) => node.category === 'activity')
  const twin = calculateFeasibility(nodes)
  const worst = twin.some((leg) => leg.status === 'CONFLICT')
    ? 'CONFLICT'
    : twin.some((leg) => leg.status === 'LOW BUFFER')
      ? 'LOW BUFFER'
      : 'FEASIBLE'
  let alternatives: string[] = []
  try {
    const indoor = await searchPlaces({
      query: `indoor restaurant museum cafe ${affected?.city ?? 'Goa'}`,
      category: 'restaurant',
      near: affected?.city ?? 'Goa',
    })
    alternatives = indoor.slice(0, 3).map((place) => place.name)
    const recommendation = rankCandidates({
      preference: 'indoor alternative during rain',
      budgetLeft: 4000,
      candidates: indoor,
    })
    return { signal, affectedNode: affected, feasibility: worst, recommendation, alternatives }
  } catch {
    return {
      signal,
      affectedNode: affected,
      feasibility: worst,
      recommendation: {
        recommendation: 'Move the outdoor activity indoors if rain holds.',
        reasons: ['Weather signal is live', 'Keep the rest of the green path'],
        costImpact: 0,
        timeImpactMinutes: 0,
        source: 'local',
      },
      alternatives,
    }
  }
}

export function simulationSignal(nodeId?: string): DisruptionSignal {
  return {
    kind: 'simulation',
    title: 'Simulated disruption',
    body: 'This alert is a labeled simulation — no live transport feed is connected.',
    nodeId,
    live: false,
  }
}
