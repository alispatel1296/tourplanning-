import { gatewayFor, iataFor, railCode } from './cityCodes'

export { iataFor, railCode } from './cityCodes'

export interface FlightPulse {
  airline?: string
  flight?: string
  from?: string
  to?: string
  status?: string
  delayMinutes?: number
  source: 'aviationstack'
}

export interface TrainPulse {
  name?: string
  number?: string
  from?: string
  to?: string
  delayMinutes?: number
  source: 'railradar'
}

export async function aviationFlights(origin: string, destination: string): Promise<FlightPulse[]> {
  const key = (process.env.AVIATIONSTACK_API_KEY ?? '').trim()
  const dep = gatewayFor(origin)?.iata ?? iataFor(origin)
  const arr = gatewayFor(destination)?.iata ?? iataFor(destination)
  if (!key || !dep || !arr) return []
  try {
    const url = `https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}&dep_iata=${dep}&arr_iata=${arr}&limit=5`
    const response = await fetch(url)
    if (!response.ok) return []
    const data = (await response.json()) as {
      data?: Array<{
        airline?: { name?: string }
        flight?: { iata?: string }
        departure?: { iata?: string; delay?: number }
        arrival?: { iata?: string; delay?: number }
        flight_status?: string
      }>
    }
    return (data.data ?? []).slice(0, 5).map((row) => ({
      airline: row.airline?.name,
      flight: row.flight?.iata,
      from: row.departure?.iata,
      to: row.arrival?.iata,
      status: row.flight_status,
      delayMinutes: Number(row.departure?.delay ?? row.arrival?.delay ?? 0) || undefined,
      source: 'aviationstack' as const,
    }))
  } catch {
    return []
  }
}

export async function railBetween(origin: string, destination: string): Promise<TrainPulse[]> {
  const key = (process.env.RAILRADAR_API_KEY ?? '').trim()
  const from = railCode(origin)
  const to = railCode(destination)
  if (!key || !from || !to) return []
  try {
    const response = await fetch(`https://api.railradar.in/v1/trains/between/${from}/${to}`, {
      headers: { Authorization: `Bearer ${key}`, accept: 'application/json' },
    })
    if (!response.ok) return []
    const data = (await response.json()) as {
      trains?: Array<{ name?: string; number?: string | number; delay?: number; from?: string; to?: string }>
      data?: Array<{ name?: string; number?: string | number; delay_minutes?: number }>
    }
    const rows = data.trains ?? data.data ?? []
    return rows.slice(0, 5).map((row) => ({
      name: row.name,
      number: row.number != null ? String(row.number) : undefined,
      from,
      to,
      delayMinutes: Number(('delay' in row ? row.delay : row.delay_minutes) ?? 0) || undefined,
      source: 'railradar' as const,
    }))
  } catch {
    return []
  }
}
