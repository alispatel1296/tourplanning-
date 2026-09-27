import { calculateFeasibility, worstTwinStatus, type TwinStatus } from '@/services/twin/feasibility'
import type { WeatherBundle, WeatherNow } from '@/services/geo/types'
import type { LocatedNode } from '@/services/maps/resolve'
import type { SocialSignal } from '@/services/social/signals'
import type { Trip, TripNode } from '@/types'

export interface WeatherDrivers {
  temperatureC: number
  rainfallMmH: number
  precipProb: number
  windKmh: number
  humidity: number
  stormHours: number
  floodIndex: number
}

export interface WeatherWhatIf {
  rainfallMmH?: number
  temperatureC?: number
  stormHours?: number
  floodIndex?: number
}

export type TwinStress = 'stable' | 'watch' | 'stressed' | 'disrupted'

export interface TwinEntityImpact {
  nodeId: string
  title: string
  city: string
  category: TripNode['category']
  lat: number
  lng: number
  outdoor: boolean
  demandDelta: number
  capacityDelta: number
  delayMinutes: number
  occupancyPressure: number
  pDisrupt: number
  pDelay: number
  confidence: number
  uncertainty: number
  status: TwinStress
  reasons: string[]
  cascades: string[]
}

export interface CascadeLink {
  fromId: string
  toId: string
  kind: 'weather' | 'demand' | 'capacity' | 'delay' | 'workforce'
  strength: number
  label: string
}

export interface CityWeatherCell {
  city: string
  lat: number
  lng: number
  drivers: WeatherDrivers
  impact: number
  label: string
}

export interface TwinSystemHealth {
  feasibility: number
  feasibilityLabel: TwinStatus
  demandShift: number
  occupancyShift: number
  delayMinutes: number
  workforceOutdoor: number
  restaurantIndoor: number
  attractionCapacity: number
  transportReliability: number
  confidence: number
  uncertainty: number
}

export interface TwinSnapshot {
  observed: WeatherDrivers
  applied: WeatherDrivers
  whatIf: boolean
  entities: TwinEntityImpact[]
  links: CascadeLink[]
  cities: CityWeatherCell[]
  system: TwinSystemHealth
  socialWeight: number
  narrative: string
  generatedAt: string
}

const OUTDOOR = /beach|baga|water|trek|outdoor|parasail|jet.?ski|fort|hike|swim|snorkel/i

export function isOutdoorNode(node: TripNode): boolean {
  return node.category === 'activity' && OUTDOOR.test(`${node.title} ${node.notes} ${node.city}`)
}

export function heatIndexC(tempC: number, humidity: number): number {
  return Math.round(tempC + Math.max(0, humidity - 40) * 0.08)
}

export function driversFromWeather(now: WeatherNow, hourly: WeatherBundle['hourly'] = []): WeatherDrivers {
  const next6 = hourly.slice(0, 6)
  const rain6 = next6.reduce((sum, hour) => sum + hour.precipitationMm, 0)
  const stormHours = next6.filter((hour) => hour.weatherCode >= 80 || hour.precipitationMm >= 4).length
  const floodIndex = Math.min(100, Math.round(rain6 * 8 + (now.weatherCode >= 95 ? 20 : 0) + now.precipitationProbability * 0.15))
  return {
    temperatureC: now.temperatureC,
    rainfallMmH: now.precipitationMm || (next6[0]?.precipitationMm ?? 0),
    precipProb: now.precipitationProbability,
    windKmh: now.windKmh,
    humidity: now.humidity,
    stormHours,
    floodIndex,
  }
}

export function applyWhatIf(base: WeatherDrivers, scenario?: WeatherWhatIf | null): WeatherDrivers {
  if (!scenario) return { ...base }
  return {
    ...base,
    rainfallMmH: scenario.rainfallMmH ?? base.rainfallMmH,
    temperatureC: scenario.temperatureC ?? base.temperatureC,
    stormHours: scenario.stormHours ?? base.stormHours,
    floodIndex: scenario.floodIndex ?? base.floodIndex,
    precipProb: Math.min(100, Math.max(base.precipProb, (scenario.rainfallMmH ?? base.rainfallMmH) * 8)),
  }
}

function clamp(value: number, min = 0, max = 1.7) {
  return Math.min(max, Math.max(min, value))
}

function unit(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function scoreSocial(signals: SocialSignal[]): { weight: number; floodBoost: number; rainBoost: number; heatBoost: number; topics: string[] } {
  if (!signals.length) return { weight: 0, floodBoost: 0, rainBoost: 0, heatBoost: 0, topics: [] }
  const weather = signals.filter((item) => item.weatherRelated)
  const pool = weather.length ? weather : signals
  const flood = pool.filter((item) => item.topics.includes('flood') || item.topics.includes('cancel')).length
  const rain = pool.filter((item) => item.topics.includes('rain') || item.topics.includes('storm')).length
  const heat = pool.filter((item) => item.topics.includes('heat')).length
  const sentiment = pool.reduce((sum, item) => sum + item.sentiment, 0) / pool.length
  return {
    weight: unit(pool.length / 8 + Math.max(0, -sentiment) * 0.15),
    floodBoost: flood * 6,
    rainBoost: rain * 0.4,
    heatBoost: heat * 0.8,
    topics: [...new Set(pool.flatMap((item) => item.topics))].slice(0, 6),
  }
}

function stressOf(pDisrupt: number, delayMinutes: number, demandDelta: number): TwinStress {
  if (pDisrupt >= 0.62 || delayMinutes >= 45) return 'disrupted'
  if (pDisrupt >= 0.4 || delayMinutes >= 20 || demandDelta <= -0.28) return 'stressed'
  if (pDisrupt >= 0.22 || delayMinutes >= 8) return 'watch'
  return 'stable'
}

export function simulateWeatherTwin(input: {
  trip: Trip
  nodes: LocatedNode[]
  observed: WeatherDrivers
  scenario?: WeatherWhatIf | null
  signals?: SocialSignal[]
}): TwinSnapshot {
  const social = scoreSocial(input.signals ?? [])
  const observed = input.observed
  const applied = applyWhatIf(observed, input.scenario)
  const appliedWithSocial: WeatherDrivers = {
    ...applied,
    rainfallMmH: applied.rainfallMmH + social.rainBoost * (input.scenario ? 0.15 : 0.35),
    floodIndex: Math.min(100, applied.floodIndex + social.floodBoost * (input.scenario ? 0.2 : 0.5)),
    temperatureC: applied.temperatureC + social.heatBoost * (input.scenario ? 0.1 : 0.25),
  }
  const rain = appliedWithSocial.rainfallMmH
  const rainN = unit(rain / 16)
  const flood = appliedWithSocial.floodIndex / 100
  const storm = unit(appliedWithSocial.stormHours / 12)
  const heat = unit((heatIndexC(appliedWithSocial.temperatureC, appliedWithSocial.humidity) - 32) / 12)
  const wind = unit(appliedWithSocial.windKmh / 55)

  const outdoorDemand = clamp(1 - rainN * 0.72 - flood * 0.42 - storm * 0.28 - heat * 0.2, 0.08, 1.15)
  const indoorFood = clamp(1 + rainN * 0.38 + storm * 0.2 + flood * 0.16, 0.75, 1.7)
  const hotelOcc = clamp(1 + rainN * 0.24 + flood * 0.2 + storm * 0.12, 0.8, 1.6)
  const attractionCap = clamp(1 - rainN * 0.55 - flood * 0.5 - storm * 0.25 - wind * 0.1, 0.12, 1.1)
  const workforce = clamp(1 - rainN * 0.4 - heat * 0.25 - storm * 0.32 - flood * 0.22, 0.15, 1.05)
  const transportRel = clamp(1 - rainN * 0.36 - flood * 0.4 - storm * 0.26 - wind * 0.14, 0.18, 1.05)
  const baseDelay = Math.round(rainN * 48 + flood * 36 + storm * 16 + wind * 10)

  const entities: TwinEntityImpact[] = input.nodes.map((node, index) => {
    const outdoor = isOutdoorNode(node)
    const next = input.nodes[index + 1]
    let demandDelta = 0
    let capacityDelta = 0
    let delayMinutes = 0
    let occupancyPressure = 0
    const reasons: string[] = []

    if (node.category === 'activity') {
      demandDelta = outdoor ? outdoorDemand - 1 : clamp(0.08 + rain * 0.02)
      capacityDelta = attractionCap - 1
      delayMinutes = Math.round(baseDelay * (outdoor ? 1.15 : 0.45))
      if (outdoor && rain >= 2) reasons.push(`Outdoor demand drops as rainfall hits ${rain.toFixed(1)} mm/h`)
      if (outdoor && flood >= 0.35) reasons.push('Flood index stresses beach / attraction capacity')
      if (heat >= 0.45 && outdoor) reasons.push('Heat index pushes guests off midday outdoor slots')
    } else if (node.category === 'food') {
      demandDelta = indoorFood - 1
      capacityDelta = clamp(0.12 - indoorFood * 0.18)
      occupancyPressure = unit(indoorFood - 0.85)
      delayMinutes = Math.round(Math.max(0, indoorFood - 1) * 28)
      if (indoorFood > 1.08) reasons.push('Indoor covers absorb displaced outdoor demand')
    } else if (node.category === 'stay') {
      demandDelta = hotelOcc - 1
      occupancyPressure = unit(hotelOcc - 0.9)
      capacityDelta = clamp(0.05 - flood * 0.2)
      if (hotelOcc > 1.06) reasons.push('Guests hold rooms longer while weather is unsettled')
    } else if (node.category === 'transport') {
      demandDelta = clamp(-flood * 0.15 - storm * 0.1)
      delayMinutes = Math.round(baseDelay * 1.25)
      capacityDelta = transportRel - 1
      if (delayMinutes >= 12) reasons.push(`Corridor delay ~${delayMinutes} min from rain / flood / wind`)
    } else {
      demandDelta = clamp(-rain * 0.02)
    }

    const pDisrupt = unit(
      (outdoor ? 0.16 : node.category === 'transport' ? 0.12 : 0.04) +
        rainN * (outdoor ? 0.55 : node.category === 'transport' ? 0.4 : 0.12) +
        flood * (outdoor ? 0.35 : 0.12) +
        storm * 0.2 +
        (node.category === 'transport' ? wind * 0.15 : 0),
    )
    const pDelay = unit(0.1 + delayMinutes / 80 + flood * 0.2)
    const confidence = unit(0.58 + social.weight * 0.22 + (input.scenario ? 0.08 : 0.14))
    const uncertainty = unit(1 - confidence + (input.scenario ? 0.08 : 0))
    const cascades: string[] = []
    if (next) cascades.push(next.id)
    if (node.category === 'transport' && next) cascades.push(next.id)
    if (outdoor) {
      const indoor = input.nodes.find((item) => item.category === 'food' && item.city === node.city)
      if (indoor) cascades.push(indoor.id)
      const stay = input.nodes.find((item) => item.category === 'stay' && item.city === node.city)
      if (stay) cascades.push(stay.id)
    }

    return {
      nodeId: node.id,
      title: node.title,
      city: node.city,
      category: node.category,
      lat: node.lat,
      lng: node.lng,
      outdoor,
      demandDelta: Number(demandDelta.toFixed(3)),
      capacityDelta: Number(capacityDelta.toFixed(3)),
      delayMinutes,
      occupancyPressure: Number(occupancyPressure.toFixed(3)),
      pDisrupt: Number(pDisrupt.toFixed(3)),
      pDelay: Number(pDelay.toFixed(3)),
      confidence: Number(confidence.toFixed(3)),
      uncertainty: Number(uncertainty.toFixed(3)),
      status: stressOf(pDisrupt, delayMinutes, demandDelta),
      reasons: reasons.slice(0, 3),
      cascades: [...new Set(cascades)],
    }
  })

  const links: CascadeLink[] = []
  for (const entity of entities) {
    if (entity.status !== 'stable') {
      links.push({
        fromId: `wx:${entity.city}`,
        toId: entity.nodeId,
        kind: 'weather',
        strength: entity.pDisrupt,
        label: `${entity.city} weather → ${entity.title}`,
      })
    }
    for (const toId of entity.cascades) {
      const target = entities.find((item) => item.nodeId === toId)
      if (!target) continue
      const kind: CascadeLink['kind'] =
        entity.category === 'transport' ? 'delay' : entity.outdoor ? 'demand' : 'capacity'
      links.push({
        fromId: entity.nodeId,
        toId,
        kind,
        strength: Math.max(entity.pDisrupt, Math.abs(entity.demandDelta)),
        label:
          kind === 'delay'
            ? `Delay at ${entity.title} compresses ${target.title}`
            : `Demand shift from ${entity.title} to ${target.title}`,
      })
    }
  }

  const cityMap = new Map<string, CityWeatherCell>()
  for (const entity of entities) {
    const existing = cityMap.get(entity.city)
    const impact = Math.max(existing?.impact ?? 0, entity.pDisrupt, Math.abs(entity.demandDelta))
    cityMap.set(entity.city, {
      city: entity.city,
      lat: entity.lat,
      lng: entity.lng,
      drivers: appliedWithSocial,
      impact,
      label:
        impact >= 0.55 ? 'Severe weather pressure' : impact >= 0.3 ? 'Watch corridor' : 'Within operating band',
    })
  }

  const extraBuffer = Math.round(rainN * 28 + flood * 30 + appliedWithSocial.stormHours * 2)
  const legs = calculateFeasibility(input.trip.nodes, [], 30 + extraBuffer)
  const worst = worstTwinStatus(legs)
  const feasibility = Math.round(
    (worst === 'CONFLICT' ? 48 : worst === 'LOW BUFFER' ? 68 : 88) - rainN * 18 - flood * 14 - storm * 8,
  )
  const confidence = unit(0.6 + social.weight * 0.25)
  const whatIf = Boolean(
    input.scenario &&
      Object.values(input.scenario).some((value) => value != null),
  )

  const narrative = buildNarrative({
    trip: input.trip,
    applied: appliedWithSocial,
    entities,
    social: social.topics,
    whatIf,
  })

  return {
    observed,
    applied: appliedWithSocial,
    whatIf,
    entities,
    links: links.slice(0, 28),
    cities: [...cityMap.values()],
    system: {
      feasibility: Math.max(38, Math.min(96, feasibility)),
      feasibilityLabel: worst,
      demandShift: Number((outdoorDemand - 1).toFixed(3)),
      occupancyShift: Number((hotelOcc - 1).toFixed(3)),
      delayMinutes: baseDelay,
      workforceOutdoor: Number(workforce.toFixed(3)),
      restaurantIndoor: Number(indoorFood.toFixed(3)),
      attractionCapacity: Number(attractionCap.toFixed(3)),
      transportReliability: Number(transportRel.toFixed(3)),
      confidence: Number(confidence.toFixed(3)),
      uncertainty: Number((1 - confidence).toFixed(3)),
    },
    socialWeight: Number(social.weight.toFixed(3)),
    narrative,
    generatedAt: new Date().toISOString(),
  }
}

function buildNarrative(input: {
  trip: Trip
  applied: WeatherDrivers
  entities: TwinEntityImpact[]
  social: string[]
  whatIf: boolean
}) {
  const hit = input.entities.filter((item) => item.status === 'disrupted' || item.status === 'stressed')
  const mode = input.whatIf ? 'Counterfactual twin' : 'Live twin'
  const head = `${mode} for ${input.trip.title}: ${input.applied.rainfallMmH.toFixed(1)} mm/h rain, ${input.applied.temperatureC}°C, flood index ${Math.round(input.applied.floodIndex)}.`
  const body = hit.length
    ? `${hit.length} nodes are under weather pressure — ${hit
        .slice(0, 3)
        .map((item) => item.title)
        .join(', ')}. Indoor food and stays absorb displaced outdoor demand; rail / road buffers widen.`
    : 'The circuit stays inside its operating band. Outdoor nodes remain feasible with standard buffers.'
  const social = input.social.length ? ` Social corroboration: ${input.social.slice(0, 4).join(', ')}.` : ''
  return `${head} ${body}${social}`
}

export function projectedNodes(nodes: TripNode[], snapshot: TwinSnapshot): TripNode[] {
  return nodes.map((node) => {
    const impact = snapshot.entities.find((item) => item.nodeId === node.id)
    if (!impact) return node
    if (node.status === 'visited' || node.status === 'alternative') return node
    if (impact.status === 'disrupted' && (impact.outdoor || node.category === 'activity')) {
      return { ...node, status: 'disrupted' }
    }
    return node
  })
}

export function emptyWhatIf(): WeatherWhatIf {
  return {}
}
