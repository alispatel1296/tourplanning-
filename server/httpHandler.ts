import type { IncomingMessage, ServerResponse } from 'node:http'
import { getSerpStats, isSerpConfigured, recentQueries, serpAccount } from './serpApiService'
import {
  compareTransport,
  composeTrip,
  searchActivities,
  searchAttractions,
  searchDestinations,
  searchEvents,
  searchFlights,
  searchHotels,
  searchImages,
  searchLocalBusinesses,
  searchMaps,
  searchNews,
  searchRestaurants,
  searchReviews,
  searchShopping,
  searchSocialSignals,
  searchTravelInformation,
  searchTrains,
} from './travelDataService'
import { explainTwinNarrative } from './twinExplain'
import { buildLivePlan } from './dynamicPlan'
import { buildLiveConflicts } from './dynamicConflicts'

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      if (!chunks.length) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>)
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function str(body: Record<string, unknown>, key: string, fallback = ''): string {
  const value = body[key]
  return typeof value === 'string' ? value : fallback
}

function num(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key]
  return typeof value === 'number' ? value : undefined
}

export async function handleTravelRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = url.pathname.replace(/\/$/, '') || '/'

  if (req.method === 'GET' && path === '/api/travel/health') {
    const account = await serpAccount()
    send(res, 200, {
      configured: isSerpConfigured(),
      status: isSerpConfigured() ? 'connected' : 'not_configured',
      provider: 'SerpApi (server-only key)',
      stats: { ...getSerpStats(), account },
    })
    return
  }

  if (req.method === 'GET' && path === '/api/travel/stats') {
    const account = await serpAccount()
    send(res, 200, { ...getSerpStats(), account, history: recentQueries() })
    return
  }

  if (req.method === 'GET' && path === '/api/travel/history') {
    send(res, 200, { items: recentQueries() })
    return
  }

  if (req.method !== 'POST') {
    send(res, 405, { message: 'Method not allowed' })
    return
  }

  const body = await readBody(req)
  try {
    if (path === '/api/travel/destinations') send(res, 200, await searchDestinations(str(body, 'q', str(body, 'query'))))
    else if (path === '/api/travel/hotels') {
      send(
        res,
        200,
        await searchHotels({
          destination: str(body, 'destination', str(body, 'near', 'Goa')),
          checkIn: str(body, 'checkIn') || undefined,
          checkOut: str(body, 'checkOut') || undefined,
          adults: num(body, 'adults'),
          maxPrice: num(body, 'maxPrice'),
        }),
      )
    } else if (path === '/api/travel/restaurants') send(res, 200, await searchRestaurants(str(body, 'near', str(body, 'q', 'Goa'))))
    else if (path === '/api/travel/activities') send(res, 200, await searchActivities(str(body, 'near', 'Goa'), str(body, 'interest', 'activities')))
    else if (path === '/api/travel/attractions') send(res, 200, await searchAttractions(str(body, 'near', 'Goa')))
    else if (path === '/api/travel/flights') {
      send(
        res,
        200,
        await searchFlights({
          origin: str(body, 'origin', 'Ahmedabad'),
          destination: str(body, 'destination', 'Goa'),
          date: str(body, 'date'),
          returnDate: str(body, 'returnDate') || undefined,
          adults: num(body, 'adults'),
        }),
      )
    } else if (path === '/api/travel/trains') send(res, 200, await searchTrains(str(body, 'origin', 'Ahmedabad'), str(body, 'destination', 'Mumbai')))
    else if (path === '/api/travel/transport') {
      send(res, 200, await compareTransport(str(body, 'origin', 'Ahmedabad'), str(body, 'destination', 'Mumbai'), str(body, 'date')))
    } else if (path === '/api/travel/info') send(res, 200, await searchTravelInformation(str(body, 'q', 'Goa travel guide')))
    else if (path === '/api/travel/events') send(res, 200, await searchEvents(str(body, 'near', 'Goa')))
    else if (path === '/api/travel/shopping') send(res, 200, await searchShopping(str(body, 'q', 'travel essentials')))
    else if (path === '/api/travel/images') send(res, 200, await searchImages(str(body, 'q', 'Goa')))
    else if (path === '/api/travel/reviews') send(res, 200, await searchReviews(str(body, 'placeId')))
    else if (path === '/api/travel/local') send(res, 200, await searchLocalBusinesses(str(body, 'q')))
    else if (path === '/api/travel/maps') send(res, 200, await searchMaps(str(body, 'q')))
    else if (path === '/api/travel/news') send(res, 200, await searchNews(str(body, 'q', 'Goa travel')))
    else if (path === '/api/travel/social-signals') {
      const cities = Array.isArray(body.cities) ? body.cities.map(String) : [str(body, 'city', 'Goa')]
      send(res, 200, await searchSocialSignals(cities))
    } else if (path === '/api/travel/twin-explain') {
      send(
        res,
        200,
        await explainTwinNarrative({
          title: str(body, 'title') || undefined,
          rainfallMmH: num(body, 'rainfallMmH'),
          temperatureC: num(body, 'temperatureC'),
          floodIndex: num(body, 'floodIndex'),
          stormHours: num(body, 'stormHours'),
          stressed: Array.isArray(body.stressed) ? body.stressed.map(String) : undefined,
          social: Array.isArray(body.social) ? body.social.map(String) : undefined,
          whatIf: body.whatIf === true,
        }),
      )
    } else if (path === '/api/travel/compose') {
      send(
        res,
        200,
        await composeTrip({
          origin: str(body, 'origin') || undefined,
          destination: str(body, 'destination') || undefined,
          interests: Array.isArray(body.interests) ? body.interests.map(String) : undefined,
          budget: num(body, 'budget'),
          duration: num(body, 'duration'),
          adults: num(body, 'adults'),
          startDate: str(body, 'startDate') || undefined,
          endDate: str(body, 'endDate') || undefined,
          brief: str(body, 'brief') || undefined,
        }),
      )
    } else if (path === '/api/travel/plan-live') {
      const destinations = Array.isArray(body.destinations)
        ? body.destinations.map(String).filter(Boolean)
        : [str(body, 'destination', 'Goa')]
      send(
        res,
        200,
        await buildLivePlan({
          origin: str(body, 'origin', 'Ahmedabad'),
          destinations,
          startDate: str(body, 'startDate', str(body, 'checkIn')),
          endDate: str(body, 'endDate', str(body, 'checkOut')),
          adults: num(body, 'adults') ?? 2,
          budget: num(body, 'budget') ?? 65000,
          styles: Array.isArray(body.styles)
            ? body.styles.map(String)
            : Array.isArray(body.interests)
              ? body.interests.map(String)
              : [],
          transport: str(body, 'transport', 'Mixed'),
          accommodation: str(body, 'accommodation', 'Premium'),
          brief: str(body, 'brief') || undefined,
        }),
      )
    } else if (path === '/api/travel/conflicts-live') {
      const cities = Array.isArray(body.cities) ? body.cities.map(String).filter(Boolean) : [str(body, 'city', 'Goa')]
      send(
        res,
        200,
        await buildLiveConflicts({
          tripId: str(body, 'tripId', 'trip-live'),
          tripTitle: str(body, 'tripTitle', 'Live circuit'),
          cities,
          origin: str(body, 'origin') || undefined,
        }),
      )
    } else send(res, 404, { message: 'Unknown travel route' })
  } catch (error) {
    send(res, 500, {
      items: [],
      message: 'Live search is temporarily unavailable.',
      meta: { configured: isSerpConfigured(), error: error instanceof Error ? error.message : 'error' },
    })
  }
}
