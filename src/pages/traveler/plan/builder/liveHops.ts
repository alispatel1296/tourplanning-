import { compareTransport, searchLocalBusinesses, searchMaps } from '@/services/travel/TravelDataService'
import type { TravelEntity } from '@/services/travel/types'
import type { HopOption, PlanHop } from '@/pages/traveler/plan/builder/catalog'
import type { TripPlan } from '@/types/plan'

const TERMINAL: Record<string, { air: string; rail: string }> = {
  ahmedabad: { air: 'SVPI Airport', rail: 'Kalupur station' },
  jaipur: { air: 'Jaipur Airport (JAI)', rail: 'Jaipur Junction' },
  udaipur: { air: 'Maharana Pratap Airport (UDR)', rail: 'Udaipur City station' },
  mumbai: { air: 'Mumbai Airport (BOM)', rail: 'Bandra / CSMT' },
  goa: { air: 'Dabolim / Mopa', rail: 'Madgaon' },
  delhi: { air: 'IGI Airport (DEL)', rail: 'New Delhi station' },
  shimla: { air: 'Chandigarh Airport (IXC)', rail: 'Kalka / Shimla' },
  srinagar: { air: 'Srinagar Airport (SXR)', rail: 'Srinagar station' },
  kashmir: { air: 'Srinagar Airport (SXR)', rail: 'Srinagar station' },
}

export interface LiveHopPack {
  options: HopOption[]
  narrator?: string
  question?: string
  source: string
}

function terminals(city: string) {
  return TERMINAL[city.trim().toLowerCase()] ?? {
    air: `${city} airport`,
    rail: `${city} railway station`,
  }
}

function cabFare(entity: TravelEntity, tag: HopOption['tag'], index: number) {
  if (entity.price && entity.price > 80) return Math.round(entity.price)
  if (tag === 'save') return 280 + index * 40
  if (tag === 'comfort') return 980 + index * 80
  return 480 + index * 50
}

function tagFor(entity: TravelEntity, index: number, total: number): HopOption['tag'] {
  const name = entity.name.toLowerCase()
  if (/innova|suv|crysta|luxury|premium|tempo/i.test(name)) return 'comfort'
  if (/ola|uber|rapido|hatch|share|auto|cheap/i.test(name)) return 'save'
  if (index === 0) return 'recommended'
  if (index === total - 1) return 'comfort'
  return index === 1 ? 'save' : 'budget'
}

function toCabOption(entity: TravelEntity, index: number, total: number, city: string, drop: string): HopOption {
  const tag = tagFor(entity, index, total)
  const price = cabFare(entity, tag, index)
  const rating = entity.rating ? ` · ${entity.rating.toFixed(1)}★` : ''
  const reviews = entity.reviewCount ? ` (${entity.reviewCount} reviews)` : ''
  const place = entity.location ? ` · ${entity.location}` : ''
  return {
    id: `live-cab-${entity.id || index}`,
    name: entity.name,
    price,
    tag,
    time: tag === 'save' ? '05:10 – 05:50' : tag === 'comfort' ? '04:45 – 05:30' : '04:50 – 05:40',
    duration: tag === 'comfort' ? '45 min' : '40 min',
    summary: `${drop} pickup${rating}${reviews}`.trim(),
    description: [
      `Live operator in ${city}${place}.`,
      entity.description,
      entity.phone ? `Phone ${entity.phone}.` : null,
      entity.priceStatus === 'price_shown' && entity.price
        ? `Quoted ${entity.currency ?? 'INR'} ${entity.price.toLocaleString('en-IN')}.`
        : 'Fare estimated from local taxi range until the operator confirms.',
      entity.sourceLabel,
    ]
      .filter(Boolean)
      .join(' '),
    patch: {
      title: entity.name,
      cost: price,
      city,
      notes: entity.location || entity.description || 'Live cab from SerpApi maps',
      lat: entity.latitude,
      lng: entity.longitude,
      placeId: entity.placeId ?? entity.providerId,
    },
  }
}

function mergeEntities(...lists: TravelEntity[][]) {
  const seen = new Set<string>()
  const out: TravelEntity[] = []
  for (const list of lists) {
    for (const item of list) {
      const key = (item.placeId || item.name).toLowerCase()
      if (!item.name || seen.has(key)) continue
      if (!/taxi|cab|cab's|cabs|transfer|tour|travels|car rental|ola|uber|meru/i.test(`${item.name} ${item.description ?? ''}`)) {
        if (out.length >= 2) continue
      }
      seen.add(key)
      out.push(item)
    }
  }
  return out.slice(0, 6)
}

export async function loadLiveHop(hop: PlanHop, plan: TripPlan): Promise<LiveHopPack | null> {
  if (hop.kind !== 'cab' && hop.id !== 'home-cab') return null

  const city = hop.city || plan.origin
  const dest = plan.destinations[0]
  const spot = terminals(city)

  const [local, maps, transport] = await Promise.allSettled([
    searchLocalBusinesses(`taxi cab airport transfer ${city}`),
    searchMaps(`best airport taxi ${city}`),
    dest ? compareTransport(city, dest, plan.startDate) : Promise.resolve(null),
  ])

  const localItems = local.status === 'fulfilled' ? local.value.items : []
  const mapItems = maps.status === 'fulfilled' ? maps.value.items : []
  const desk = transport.status === 'fulfilled' ? transport.value : null
  const flight = desk && 'flights' in desk ? desk.flights[0] : undefined
  const train = desk && 'trains' in desk ? desk.trains[0] : undefined
  const drop = flight ? spot.air : train ? spot.rail : `${spot.air} or ${spot.rail}`

  const entities = mergeEntities(localItems, mapItems)
  if (!entities.length) return null

  const options = entities.map((item, index) => toCabOption(item, index, entities.length, city, drop))
  if (!options.some((item) => item.tag === 'recommended') && options[0]) {
    options[0] = { ...options[0], tag: 'recommended' }
  }

  const next = dest
    ? flight
      ? `Live flights toward ${dest} are up (${flight.name}). Hold a cab that reaches ${spot.air} with a 45-minute buffer.`
      : train
        ? `Live trains toward ${dest} are up (${train.name}). Hold a cab that reaches ${spot.rail} with a station buffer.`
        : `First, a live pickup in ${city} toward ${dest}.`
    : `Live taxi operators in ${city} — pick the door-to-door start.`

  return {
    options,
    narrator: `You start from home in ${city}. ${next}`,
    question: dest ? `Which live pickup should start Day 1 toward ${dest}?` : 'Which live pickup should start Day 1?',
    source: 'SerpApi maps · live taxi / transfer',
  }
}
