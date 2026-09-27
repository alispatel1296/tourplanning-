import { isSerpConfigured, serpApiSearch, type SerpCallResult } from './serpApiService'
import {
  normalizeDestinations,
  normalizeEvents,
  normalizeFlights,
  normalizeHotels,
  normalizeImages,
  normalizeLocal,
  normalizeNews,
  normalizeOrganic,
  normalizeReviews,
  normalizeShopping,
} from './normalize'
import type {
  ComposedOption,
  ComposeTripResult,
  ScoredEntity,
  SearchPlan,
  TravelEntity,
  TravelSearchMeta,
  TravelSearchResult,
} from './types'

import { gatewayFor, iataFor } from './cityCodes'

function iata(city: string): string | undefined {
  return iataFor(city) ?? gatewayFor(city)?.iata
}

function emptyMeta(engine: string, query: string, extra?: Partial<TravelSearchMeta>): TravelSearchMeta {
  return {
    engine,
    query,
    latencyMs: 0,
    resultCount: 0,
    cache: 'miss',
    configured: isSerpConfigured(),
    ...extra,
  }
}

function fromCall(call: SerpCallResult): TravelSearchMeta {
  return {
    engine: call.engine,
    query: call.query,
    latencyMs: call.latencyMs,
    resultCount: call.resultCount,
    cache: call.cache,
    configured: true,
  }
}

function unavailable<T>(engine: string, query: string, error: unknown): TravelSearchResult<T> {
  const message =
    error instanceof Error && error.message === 'SERPAPI_NOT_CONFIGURED'
      ? 'Live search is not configured. Add SERPAPI_API_KEY on the server.'
      : error instanceof Error && error.message === 'RATE_LIMIT'
        ? 'Live search is temporarily unavailable.'
        : 'Live search is temporarily unavailable.'
  return { items: [], meta: emptyMeta(engine, query, { error: message, configured: isSerpConfigured() }), message }
}

async function run(engine: string, params: Record<string, string | number | undefined>, parse: (data: Record<string, unknown>) => TravelEntity[]): Promise<TravelSearchResult> {
  const query = String(params.q ?? params.departure_id ?? engine)
  try {
    const call = await serpApiSearch(engine, { hl: 'en', gl: 'in', ...params })
    return { items: parse(call.data), meta: fromCall(call) }
  } catch (error) {
    return unavailable(engine, query, error)
  }
}

export function buildSearchPlan(input: {
  origin?: string
  destination?: string
  interests?: string[]
  budget?: number
  duration?: number
  adults?: number
  checkIn?: string
  checkOut?: string
}): SearchPlan {
  const destination = input.destination || 'Goa'
  const interests = input.interests?.length ? input.interests : ['food', 'beaches']
  const queries: SearchPlan['queries'] = [
    { id: 'dest', engine: 'google', q: `${input.origin ?? 'Ahmedabad'} to ${destination} ${input.duration ?? 6} day trip under ₹${input.budget ?? 65000}`, purpose: 'destinations' },
    { id: 'hotels', engine: 'google_hotels', q: `${destination} hotels`, purpose: 'hotels' },
    { id: 'food', engine: 'google_maps', q: `best ${interests.includes('food') ? 'local restaurants' : 'restaurants'} in ${destination}`, purpose: 'restaurants' },
    { id: 'acts', engine: 'google_maps', q: `${destination} ${interests.includes('adventure') ? 'adventure activities water sports' : 'tourist attractions'}`, purpose: 'activities' },
  ]
  if (iata(input.origin ?? 'Ahmedabad') && iata(destination)) {
    queries.push({ id: 'flights', engine: 'google_flights', q: `${input.origin} ${destination}`, purpose: 'flights' })
  }
  return {
    origin: input.origin ?? 'Ahmedabad',
    destination,
    interests,
    budget: input.budget ?? 65000,
    duration: input.duration ?? 6,
    adults: input.adults ?? 2,
    checkIn: input.checkIn ?? new Date().toISOString().slice(0, 10),
    checkOut: input.checkOut ?? new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    queries,
  }
}

export function scoreEntities(items: TravelEntity[], prefs: { budget?: number; interests?: string[]; stayBudget?: number }): ScoredEntity[] {
  return items.map((item) => {
    const budgetFit =
      item.price == null || !prefs.stayBudget
        ? 70
        : item.price <= prefs.stayBudget
          ? Math.round(100 - Math.min(40, ((prefs.stayBudget - item.price) / prefs.stayBudget) * 10))
          : Math.max(20, Math.round(100 - ((item.price - prefs.stayBudget) / prefs.stayBudget) * 80))
    const ratingFit = item.rating != null ? Math.round((item.rating / 5) * 100) : 60
    const locationFit = item.latitude != null ? 88 : 65
    const hay = `${item.name} ${item.description ?? ''} ${item.amenities?.join(' ') ?? ''}`.toLowerCase()
    const hits = (prefs.interests ?? []).filter((interest) => hay.includes(interest.toLowerCase())).length
    const preferenceFit = prefs.interests?.length ? Math.min(100, 60 + hits * 15) : 70
    const timeFit = 75
    const availabilityFit =
      item.availabilityStatus === 'confirmed_by_source' ? 90 : item.availabilityStatus === 'available_information' ? 70 : 50
    const reasons = [
      item.price != null ? `Price shown: ${item.currency ?? 'INR'} ${item.price}` : 'Price unavailable from the source',
      item.rating != null ? `${item.rating.toFixed(1)}★ from retrieved reviews` : 'Rating unavailable',
      item.location ? `Listed at ${item.location}` : 'Location details limited in the source',
    ]
    return {
      ...item,
      scores: { budgetFit, locationFit, ratingFit, preferenceFit, timeFit, availabilityFit },
      reasons,
    }
  })
}

function labelFits(items: ScoredEntity[]): ScoredEntity[] {
  if (!items.length) return items
  const byPrice = [...items].filter((item) => item.price != null).sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  const byRating = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  const labels = new Map<string, string>()
  if (byPrice[0]) labels.set(byPrice[0].id, 'Budget Fit')
  if (byRating[0]) labels.set(byRating[0].id, labels.get(byRating[0].id) ? labels.get(byRating[0].id)! : 'Experience Fit')
  const premium = [...byPrice].reverse()[0]
  if (premium) labels.set(premium.id, labels.has(premium.id) ? labels.get(premium.id)! : 'Premium Fit')
  const family = items.find((item) => /family|pool|kids|resort/i.test(`${item.name} ${item.amenities?.join(' ')}`))
  if (family) labels.set(family.id, labels.has(family.id) ? labels.get(family.id)! : 'Family Fit')
  const location = [...items].sort((a, b) => b.scores.locationFit - a.scores.locationFit)[0]
  if (location) labels.set(location.id, labels.has(location.id) ? labels.get(location.id)! : 'Location Fit')
  return items.map((item) => ({ ...item, fitLabel: labels.get(item.id) }))
}

export async function searchDestinations(q: string): Promise<TravelSearchResult<ScoredEntity>> {
  const google = await run('google', { q, location: 'India', google_domain: 'google.co.in' }, (data) => normalizeDestinations(data))
  let extra: TravelEntity[] = []
  try {
    const explore = await serpApiSearch('google_travel_explore', { departure_id: 'AMD', outbound_date: new Date().toISOString().slice(0, 10), currency: 'INR' })
    extra = normalizeDestinations(explore.data)
  } catch {
    extra = []
  }
  const items = scoreEntities([...google.items, ...extra].slice(0, 8), { interests: [q] })
  return { items, meta: google.meta, message: google.message }
}

export async function searchHotels(input: { destination: string; checkIn?: string; checkOut?: string; adults?: number; maxPrice?: number }) {
  const inDate = input.checkIn ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const outDate = input.checkOut ?? new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  const result = await run(
    'google_hotels',
    {
      q: `${input.destination} hotels`,
      check_in_date: inDate,
      check_out_date: outDate,
      adults: input.adults ?? 2,
      currency: 'INR',
      max_price: input.maxPrice,
    },
    normalizeHotels,
  )
  const scored = labelFits(scoreEntities(result.items, { stayBudget: input.maxPrice, interests: ['hotel'] }))
  return { ...result, items: scored }
}

export async function searchRestaurants(near: string) {
  const result = await run('google_maps', { q: `restaurants near ${near}`, type: 'search' }, (data) => normalizeLocal(data, 'restaurant'))
  return { ...result, items: scoreEntities(result.items, { interests: ['food'] }) }
}

export async function searchActivities(near: string, interest = 'activities') {
  const result = await run('google_maps', { q: `${near} ${interest}`, type: 'search' }, (data) => normalizeLocal(data, 'activity'))
  return { ...result, items: scoreEntities(result.items, { interests: [interest] }) }
}

export async function searchAttractions(near: string) {
  return run('google_maps', { q: `tourist attractions in ${near}`, type: 'search' }, (data) => normalizeLocal(data, 'attraction'))
}

export async function searchFlights(input: { origin: string; destination: string; date: string; returnDate?: string; adults?: number }) {
  const from = iata(input.origin)
  const local = iataFor(input.destination)
  const gateway = gatewayFor(input.destination)
  const to = gateway?.iata ?? local
  if (!from || !to) {
    return {
      items: [] as TravelEntity[],
      meta: emptyMeta('google_flights', `${input.origin} ${input.destination}`, { error: 'Airport code unavailable for this city' }),
      message: 'Flight search needs a known airport or gateway for this city.',
    }
  }
  const result = await run(
    'google_flights',
    {
      departure_id: from,
      arrival_id: to,
      outbound_date: input.date,
      return_date: input.returnDate,
      currency: 'INR',
      adults: input.adults ?? 2,
      type: input.returnDate ? 1 : 2,
    },
    normalizeFlights,
  )
  if (!gateway) return result
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      description: `${item.description ?? ''} Gateway ${gateway.name} (${gateway.iata}) for ${input.destination}.`.trim(),
    })),
    message: `Flights are retrieved via ${gateway.name} (${gateway.iata}), the usual air gateway for ${input.destination}.`,
  }
}

export async function searchTravelInformation(q: string) {
  return run('google', { q, location: 'India', google_domain: 'google.co.in' }, (data) => normalizeOrganic(data, 'info'))
}

export async function searchEvents(near: string) {
  return run('google_events', { q: `events in ${near}` }, normalizeEvents)
}

export async function searchShopping(q: string) {
  return run('google_shopping', { q, google_domain: 'google.co.in' }, normalizeShopping)
}

export async function searchImages(q: string) {
  return run('google_images', { q }, normalizeImages)
}

export async function searchReviews(placeId: string) {
  return run('google_maps_reviews', { place_id: placeId, hl: 'en' }, normalizeReviews)
}

export async function searchLocalBusinesses(q: string) {
  const result = await run('google_maps', { q, type: 'search' }, (data) => normalizeLocal(data, 'local'))
  return { ...result, items: scoreEntities(result.items, { interests: [q] }) }
}

export async function searchMaps(q: string) {
  return searchLocalBusinesses(q)
}

export async function searchNews(q: string) {
  return run('google_news', { q, gl: 'in' }, normalizeNews)
}

export async function searchSocialSignals(cities: string[]) {
  const unique = [...new Set(cities.map((city) => city.trim()).filter(Boolean))].slice(0, 3)
  if (!unique.length) unique.push('Goa')
  const queries = unique.map((city) => `${city} weather rain flood tourists travel`)
  const news = await Promise.all(queries.map((q) => searchNews(q)))
  const reports = await run(
    'google',
    {
      q: `${unique.join(' OR ')} weather traveler reports rain delay beach hotel`,
      google_domain: 'google.co.in',
    },
    (data) =>
      normalizeOrganic(data, 'news').map((item) => ({
        ...item,
        type: 'news' as const,
        description: item.description ?? 'Public traveler / search signal',
      })),
  )
  const items = [
    ...news.flatMap((result, index) =>
      result.items.map((item) => ({
        ...item,
        location: item.location ?? unique[index],
        sourceLabel: 'Google News via SerpApi',
      })),
    ),
    ...reports.items.map((item) => ({
      ...item,
      sourceLabel: 'Google Search via SerpApi',
    })),
  ]
  return {
    items,
    metas: [...news.map((result) => result.meta), reports.meta],
    meta: {
      configured: isSerpConfigured(),
      engine: 'google_news+google',
      query: queries.join(' | '),
      latencyMs: [...news, reports].reduce((sum, result) => sum + result.meta.latencyMs, 0),
      resultCount: items.length,
      cache: news.some((result) => result.meta.cache === 'miss') || reports.meta.cache === 'miss' ? 'miss' : 'hit',
    },
    message: !isSerpConfigured() ? 'Live search is not configured.' : undefined,
  }
}

export async function searchTrains(origin: string, destination: string) {
  const result = await run(
    'google',
    { q: `trains ${origin} to ${destination} IRCTC`, google_domain: 'google.co.in' },
    (data) =>
      normalizeOrganic(data, 'train').map((item) => ({
        ...item,
        type: 'train' as const,
        description: `${item.description ?? ''} Search-derived · not live IRCTC inventory.`.trim(),
        availabilityStatus: 'available_information' as const,
        priceStatus: 'price_unavailable' as const,
      })),
  )
  return result
}

export async function compareTransport(origin: string, destination: string, date: string) {
  const [flights, trains, buses] = await Promise.all([
    searchFlights({ origin, destination, date }),
    searchTrains(origin, destination),
    run('google', { q: `bus ${origin} to ${destination} ticket price`, google_domain: 'google.co.in' }, (data) =>
      normalizeOrganic(data, 'info').map((item) => ({ ...item, type: 'info' as const, description: `${item.description ?? ''} Search-derived bus options.` })),
    ),
  ])
  return {
    flights: flights.items,
    trains: trains.items,
    buses: buses.items,
    metas: [flights.meta, trains.meta, buses.meta],
    message: !isSerpConfigured() ? 'Live search is not configured.' : undefined,
  }
}

function pick<T>(items: T[], index: number): T | undefined {
  return items[index] ?? items[0]
}

export async function composeTrip(input: {
  origin?: string
  destination?: string
  interests?: string[]
  budget?: number
  duration?: number
  adults?: number
  startDate?: string
  endDate?: string
  brief?: string
}): Promise<ComposeTripResult> {
  const dest = input.destination || (input.brief?.match(/goa|jaipur|kerala|udaipur|mumbai/i)?.[0] ?? 'Goa')
  const plan = buildSearchPlan({
    origin: input.origin,
    destination: dest,
    interests: input.interests,
    budget: input.budget,
    duration: input.duration,
    adults: input.adults,
    checkIn: input.startDate,
    checkOut: input.endDate,
  })
  if (!isSerpConfigured()) {
    return {
      configured: false,
      plan,
      destinations: [],
      hotels: [],
      restaurants: [],
      activities: [],
      attractions: [],
      flights: [],
      transport: [],
      options: [],
      metas: [],
      message: 'Live search is not configured. Add SERPAPI_API_KEY on the server.',
    }
  }

  const stayBudget = Math.round((plan.budget * 0.35) / Math.max(1, plan.duration - 1))
  const [destinations, hotels, restaurants, activities, attractions, flights] = await Promise.all([
    searchDestinations(plan.queries[0].q),
    searchHotels({ destination: plan.destination, checkIn: plan.checkIn, checkOut: plan.checkOut, adults: plan.adults, maxPrice: stayBudget * plan.duration }),
    searchRestaurants(plan.destination),
    searchActivities(plan.destination, plan.interests.includes('adventure') ? 'adventure water sports' : 'beaches attractions'),
    searchAttractions(plan.destination),
    searchFlights({ origin: plan.origin, destination: plan.destination, date: plan.checkIn, returnDate: plan.checkOut, adults: plan.adults }),
  ])

  const hotelList = hotels.items
  const foodList = restaurants.items
  const actList = activities.items
  const flightList = flights.items

  const makeOption = (id: string, title: string, focus: string, h: number, r: number, a: number, f: number, extra: string[]): ComposedOption => {
    const hotel = pick(hotelList, h)
    const restaurant = pick(foodList, r)
    const activity = pick(actList, a)
    const flight = pick(flightList, f)
    const parts = [hotel?.price, restaurant?.price, activity?.price, flight?.price].filter((value): value is number => value != null)
    const estimatedTotal = parts.length ? parts.reduce((sum, value) => sum + value, 0) : undefined
    return {
      id,
      title,
      focus,
      hotel,
      restaurant,
      activity,
      flight,
      estimatedTotal,
      remaining: estimatedTotal != null ? plan.budget - estimatedTotal : undefined,
      tradeoffs: extra,
      reasons: [
        hotel ? `Stay: ${hotel.name}${hotel.price != null ? ` · ${hotel.currency} ${hotel.price}` : ' · price unavailable'}` : 'Stay: information unavailable',
        restaurant ? `Food: ${restaurant.name}` : 'Food: information unavailable',
        activity ? `Do: ${activity.name}` : 'Activity: information unavailable',
      ],
    }
  }

  const options = [
    makeOption('balanced', 'OPTION 1 — Balanced', 'Mix of stay, food, and a retrieved activity', 0, 0, 0, 0, ['Uses first retrieved hotel, restaurant, and activity']),
    makeOption('budget', 'OPTION 2 — Budget Focused', 'Lowest retrieved stay price', hotelList.length - 1, 1, 1, flightList.length - 1, ['Prefers cheaper retrieved stay if a price exists']),
    makeOption('adventure', 'OPTION 3 — Adventure Focused', 'Leads with a retrieved activity', 1, 0, 0, 0, ['Keeps the first activity candidate on the path']),
    makeOption('relaxed', 'OPTION 4 — Relaxed', 'Fewer hops, first restaurant-led evening', 0, 0, Math.min(2, actList.length - 1), 0, ['Fewer activity hops']),
  ].filter((option) => option.hotel || option.restaurant || option.activity)

  return {
    configured: true,
    plan,
    destinations: destinations.items,
    hotels: hotelList,
    restaurants: foodList,
    activities: actList,
    attractions: attractions.items,
    flights: flightList,
    transport: flightList,
    options,
    metas: [destinations.meta, hotels.meta, restaurants.meta, activities.meta, attractions.meta, flights.meta],
  }
}
