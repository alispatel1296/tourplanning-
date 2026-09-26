import type { TravelEntity, TravelEntityType, AvailabilityStatus, PriceStatus } from './types'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''))
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function coords(value: unknown): { lat?: number; lng?: number } {
  const row = asRecord(value)
  return { lat: num(row.latitude ?? row.lat), lng: num(row.longitude ?? row.lng ?? row.lon) }
}

function imagesFrom(row: Record<string, unknown>): string[] {
  const out: string[] = []
  const thumb = text(row.thumbnail ?? row.thumbnail_url ?? row.image)
  if (thumb) out.push(thumb)
  const images = row.images
  if (Array.isArray(images)) {
    images.forEach((item) => {
      const rec = asRecord(item)
      const url = text(rec.original_image ?? rec.thumbnail ?? rec.link)
      if (url) out.push(url)
    })
  }
  return [...new Set(out)]
}

function priceOf(row: Record<string, unknown>): { price?: number; currency?: string; status: PriceStatus } {
  const extracted =
    num(row.extracted_price) ??
    num(asRecord(row.rate_per_night).extracted_lowest) ??
    num(asRecord(row.total_rate).extracted_lowest) ??
    num(asRecord(row.price).extracted_lowest)
  const raw = text(row.price) ?? text(asRecord(row.rate_per_night).lowest)
  if (extracted == null && !raw) return { status: 'price_unavailable' }
  const currency = raw?.includes('₹') || raw?.includes('INR') ? 'INR' : raw?.includes('$') ? 'USD' : 'INR'
  return { price: extracted, currency, status: extracted != null ? 'price_shown' : 'price_unavailable' }
}

function availabilityOf(row: Record<string, unknown>): AvailabilityStatus {
  if (row.free_cancellation === true || row.extracted_price != null || asRecord(row.rate_per_night).extracted_lowest != null) {
    return 'confirmed_by_source'
  }
  if (row.hours || row.rating || row.overall_rating) return 'available_information'
  return 'availability_unknown'
}

export function entity(
  type: TravelEntityType,
  row: Record<string, unknown>,
  extras: Partial<TravelEntity> = {},
): TravelEntity {
  const geo = coords(row.gps_coordinates ?? row.gps)
  const price = priceOf(row)
  const name = text(row.name ?? row.title ?? row.destination) ?? 'Untitled'
  const id = text(row.place_id ?? row.property_token ?? row.data_id ?? row.flight_id) ?? `${type}-${name}-${geo.lat ?? ''}`
  return {
    id,
    type,
    description: text(row.description ?? row.snippet ?? row.type),
    location: text(row.address ?? row.location ?? row.displayed_link),
    latitude: geo.lat,
    longitude: geo.lng,
    rating: num(row.rating ?? row.overall_rating),
    reviewCount: num(row.reviews ?? row.reviews_count ?? row.review_count),
    price: price.price,
    currency: price.currency,
    priceStatus: price.status,
    availabilityStatus: extras.availabilityStatus ?? availabilityOf(row),
    images: imagesFrom(row),
    openingHours: text(row.hours) ?? (Array.isArray(row.operating_hours) ? row.operating_hours.map(String).join('; ') : undefined),
    website: text(row.website ?? row.link),
    phone: text(row.phone),
    sourceUrl: text(row.link ?? row.serpapi_link ?? row.source),
    bookingUrl: text(row.link ?? row.booking_link),
    amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : undefined,
    placeId: text(row.place_id ?? row.data_cid),
    providerId: text(row.property_token ?? row.place_id ?? row.data_id),
    source: 'google_via_serpapi',
    sourceLabel: 'Source: Google / SerpApi',
    lastFetchedAt: new Date().toISOString(),
    ...extras,
    name: extras.name ?? name,
  }
}

export function dedupeEntities(items: TravelEntity[]): TravelEntity[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const coord = item.latitude != null && item.longitude != null ? `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}` : ''
    const key = (item.placeId || item.providerId || `${item.name.toLowerCase()}|${item.location ?? ''}|${coord}`).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return Boolean(item.name)
  })
}

export function normalizeHotels(data: Record<string, unknown>): TravelEntity[] {
  const properties = Array.isArray(data.properties) ? data.properties : []
  const ads = Array.isArray(data.ads) ? data.ads : []
  return dedupeEntities([...properties, ...ads].map((row) => entity('hotel', asRecord(row))))
}

export function normalizeLocal(data: Record<string, unknown>, type: TravelEntityType): TravelEntity[] {
  const rows = Array.isArray(data.local_results) ? data.local_results : []
  return dedupeEntities(rows.map((row) => entity(type, asRecord(row))))
}

export function normalizeFlights(data: Record<string, unknown>): TravelEntity[] {
  const packs = [...(Array.isArray(data.best_flights) ? data.best_flights : []), ...(Array.isArray(data.other_flights) ? data.other_flights : [])]
  return packs.map((pack, index) => {
    const row = asRecord(pack)
    const flights = Array.isArray(row.flights) ? row.flights.map(asRecord) : []
    const first = flights[0] ?? {}
    const last = flights[flights.length - 1] ?? first
    const price = num(row.price)
    const airline = text(first.airline) ?? 'Flight'
    const number = text(first.flight_number)
    return entity('flight', row, {
      id: `flight-${index}-${number ?? airline}`,
      name: [airline, number].filter(Boolean).join(' · ') || 'Flight option',
      description: text(row.total_duration) ? `Duration ${row.total_duration}${row.layovers ? ` · ${Array.isArray(row.layovers) ? row.layovers.length : 0} stop(s)` : ''}` : undefined,
      price,
      currency: 'INR',
      priceStatus: price != null ? 'price_shown' : 'price_unavailable',
      availabilityStatus: price != null ? 'confirmed_by_source' : 'availability_unknown',
      sourceUrl: text(row.booking_token) ? undefined : text(row.departure_airport),
    })
  })
}

export function normalizeOrganic(data: Record<string, unknown>, type: TravelEntityType): TravelEntity[] {
  const rows = Array.isArray(data.organic_results) ? data.organic_results : []
  return dedupeEntities(
    rows.slice(0, 8).map((row) => {
      const rec = asRecord(row)
      return entity(type, rec, {
        name: text(rec.title) ?? 'Result',
        description: text(rec.snippet),
        sourceUrl: text(rec.link),
        priceStatus: 'price_unavailable',
        availabilityStatus: 'available_information',
      })
    }),
  )
}

export function normalizeEvents(data: Record<string, unknown>): TravelEntity[] {
  const rows = Array.isArray(data.events_results) ? data.events_results : []
  return dedupeEntities(
    rows.map((row) => {
      const rec = asRecord(row)
      const when = asRecord(rec.date)
      return entity('event', rec, {
        description: [text(when.when), text(rec.address)].filter(Boolean).join(' · ') || text(rec.description),
        location: Array.isArray(rec.address) ? rec.address.map(String).join(', ') : text(rec.address),
      })
    }),
  )
}

export function normalizeImages(data: Record<string, unknown>): TravelEntity[] {
  const rows = Array.isArray(data.images_results) ? data.images_results : []
  return rows.slice(0, 10).map((row, index) => {
    const rec = asRecord(row)
    return entity('image', rec, {
      id: `img-${index}`,
      name: text(rec.title) ?? 'Image',
      images: [text(rec.original) ?? text(rec.thumbnail)].filter(Boolean) as string[],
      sourceUrl: text(rec.link),
      priceStatus: 'price_unavailable',
    })
  })
}

export function normalizeNews(data: Record<string, unknown>): TravelEntity[] {
  const rows = Array.isArray(data.news_results) ? data.news_results : []
  return rows.slice(0, 8).map((row) => {
    const rec = asRecord(row)
    return entity('news', rec, {
      name: text(rec.title) ?? 'Story',
      description: text(rec.snippet),
      sourceUrl: text(rec.link),
      priceStatus: 'price_unavailable',
    })
  })
}

export function normalizeShopping(data: Record<string, unknown>): TravelEntity[] {
  const rows = Array.isArray(data.shopping_results) ? data.shopping_results : []
  return rows.slice(0, 8).map((row) => entity('shopping', asRecord(row)))
}

export function normalizeReviews(data: Record<string, unknown>): TravelEntity[] {
  const rows = Array.isArray(data.reviews) ? data.reviews : []
  return rows.slice(0, 8).map((row, index) => {
    const rec = asRecord(row)
    return entity('review', rec, {
      id: text(rec.iso_date) ?? `review-${index}`,
      name: text(asRecord(rec.user).name) ?? 'Reviewer',
      description: text(rec.snippet ?? rec.text),
      rating: num(rec.rating),
      priceStatus: 'price_unavailable',
    })
  })
}

export function normalizeDestinations(data: Record<string, unknown>): TravelEntity[] {
  const explore = Array.isArray(data.destinations) ? data.destinations : []
  if (explore.length) {
    return dedupeEntities(
      explore.map((row) => {
        const rec = asRecord(row)
        return entity('destination', rec, {
          name: text(rec.name ?? rec.destination) ?? 'Destination',
          description: text(rec.description ?? rec.flight_price),
        })
      }),
    )
  }
  return normalizeOrganic(data, 'destination')
}
