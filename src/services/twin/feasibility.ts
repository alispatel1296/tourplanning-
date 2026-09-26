import type { TripNode } from '@/types'
import type { RouteLeg } from '@/services/geo/types'

export type TwinStatus = 'FEASIBLE' | 'LOW BUFFER' | 'CONFLICT'

export interface TwinLeg {
  fromId: string
  toId: string
  departure?: string
  arrival?: string
  durationMinutes: number
  bufferMinutes: number
  requiredBuffer: number
  status: TwinStatus
}

const REQUIRED = 30

function parseClock(value: string): number | null {
  const match = value.match(/(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function startMinutes(node: TripNode): number | null {
  const first = node.time.split('–')[0]?.trim() ?? node.time
  return parseClock(first)
}

export function assessBuffer(bufferMinutes: number, requiredBuffer = REQUIRED): TwinStatus {
  if (bufferMinutes < 0) return 'CONFLICT'
  if (bufferMinutes < requiredBuffer) return 'LOW BUFFER'
  return 'FEASIBLE'
}

export function calculateFeasibility(
  nodes: TripNode[],
  legs: RouteLeg[] = [],
  requiredBuffer = REQUIRED,
): TwinLeg[] {
  const main = nodes.filter((node) => node.status !== 'alternative' && node.status !== 'disrupted')
  const result: TwinLeg[] = []
  for (let i = 0; i < main.length - 1; i += 1) {
    const from = main[i]
    const to = main[i + 1]
    const route = legs[i]
    const durationMinutes = route ? Math.round(route.durationSeconds / 60) : 0
    const fromStart = startMinutes(from)
    const toStart = startMinutes(to)
    const arrival = fromStart != null && durationMinutes ? fromStart + durationMinutes : toStart
    const bufferMinutes = toStart != null && arrival != null ? toStart - arrival : requiredBuffer
    result.push({
      fromId: from.id,
      toId: to.id,
      departure: from.time,
      arrival: to.time,
      durationMinutes,
      bufferMinutes,
      requiredBuffer,
      status: assessBuffer(bufferMinutes, requiredBuffer),
    })
  }
  return result
}

export function worstTwinStatus(legs: TwinLeg[]): TwinStatus {
  if (legs.some((leg) => leg.status === 'CONFLICT')) return 'CONFLICT'
  if (legs.some((leg) => leg.status === 'LOW BUFFER')) return 'LOW BUFFER'
  return 'FEASIBLE'
}
