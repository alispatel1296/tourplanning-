import { places } from '@/lib/plan'
import type { Trip } from '@/types'

const FALLBACK = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70'

export const CITY_COVER: Record<string, string> = {
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=70',
  goa: FALLBACK,
  baga: FALLBACK,
  calangute: FALLBACK,
  jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70',
  kochi: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=70',
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70',
  munnar: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=70',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=70',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=70',
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=70',
  rishikesh: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=70',
  pondicherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
  puducherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=70',
  hampi: 'https://images.unsplash.com/photo-1600100397676-0c25363d389d?auto=format&fit=crop&w=1200&q=70',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=70',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=70',
  udaipur: 'https://images.unsplash.com/photo-1599661046827-dacff0c0bd5c?auto=format&fit=crop&w=1200&q=70',
  shimla: 'https://images.unsplash.com/photo-1597074866923-dc058de18517?auto=format&fit=crop&w=1200&q=70',
  kashmir: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70',
  srinagar: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70',
  gulmarg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70',
  pahalgam: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70',
  leh: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70',
  ladakh: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70',
  jodhpur: 'https://images.unsplash.com/photo-1477583967329-4f26d53d18d4?auto=format&fit=crop&w=1200&q=70',
  jaisalmer: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=1200&q=70',
  amritsar: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=70',
  hyderabad: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=1200&q=70',
  kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=70',
  darjeeling: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=70',
  gangtok: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70',
  andaman: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1200&q=70',
  pune: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=70',
  ooty: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=70',
  coorg: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=70',
  gokarna: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70',
  varkala: FALLBACK,
  kodaikanal: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70',
  'mount abu': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70',
  bhuj: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=70',
  dharamshala: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=70',
  chandigarh: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=70',
  mysuru: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
  mysore: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
}

export const COVER_FALLBACK = FALLBACK

function tokenCover(token: string) {
  const key = token.trim().toLowerCase()
  if (!key || key === 'ahmedabad') return null
  if (CITY_COVER[key]) return CITY_COVER[key]
  const place = places.find(
    (item) => item.name.toLowerCase() === key || key.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(key),
  )
  if (place?.image) return place.image
  for (const [city, url] of Object.entries(CITY_COVER)) {
    if (key.includes(city)) return url
  }
  return null
}

export function coverFor(trip: Trip) {
  const tokens = [
    ...trip.destinations.map((item) => item.city),
    ...trip.nodes.map((node) => node.city),
    trip.title,
    ...trip.route.split(/→|,|&/).map((part) => part.trim()),
  ]
  for (const token of tokens) {
    const hit = tokenCover(token)
    if (hit) return hit
  }
  return FALLBACK
}

export function placeCover(name: string, image?: string) {
  return tokenCover(name) ?? image ?? FALLBACK
}
