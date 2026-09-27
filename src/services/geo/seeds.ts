import type { GeoPoint } from '@/services/geo/types'

const seed = (point: Omit<GeoPoint, 'source'>): GeoPoint => ({ ...point, source: 'seed' })

function pin(
  lat: number,
  lng: number,
  city: string,
  state: string,
  formattedAddress?: string,
): GeoPoint {
  return seed({
    lat,
    lng,
    formattedAddress: formattedAddress ?? `${city}, ${state}, India`,
    city,
    state,
    country: 'India',
  })
}

export const CITY_SEEDS: Record<string, GeoPoint> = {
  ahmedabad: pin(23.0225, 72.5714, 'Ahmedabad', 'Gujarat'),
  mumbai: pin(19.076, 72.8777, 'Mumbai', 'Maharashtra'),
  bombay: pin(19.076, 72.8777, 'Mumbai', 'Maharashtra'),
  goa: pin(15.4909, 73.8278, 'Goa', 'Goa'),
  panaji: pin(15.4909, 73.8278, 'Panaji', 'Goa'),
  baga: pin(15.5553, 73.7517, 'Baga', 'Goa', 'Baga Beach, Goa, India'),
  'baga beach': pin(15.5553, 73.7517, 'Baga', 'Goa', 'Baga Beach, Goa, India'),
  candolim: pin(15.518, 73.763, 'Candolim', 'Goa'),
  calangute: pin(15.5439, 73.7553, 'Calangute', 'Goa'),
  palolem: pin(15.01, 74.023, 'Palolem', 'Goa'),
  ponda: pin(15.401, 74.007, 'Ponda', 'Goa'),
  andheri: pin(19.1136, 72.8697, 'Mumbai', 'Maharashtra'),
  shimla: pin(31.1048, 77.1734, 'Shimla', 'Himachal Pradesh'),
  manali: pin(32.2432, 77.1892, 'Manali', 'Himachal Pradesh'),
  chandigarh: pin(30.7333, 76.7794, 'Chandigarh', 'Chandigarh'),
  jaipur: pin(26.9124, 75.7873, 'Jaipur', 'Rajasthan'),
  udaipur: pin(24.5854, 73.7125, 'Udaipur', 'Rajasthan'),
  jodhpur: pin(26.2389, 73.0243, 'Jodhpur', 'Rajasthan'),
  jaisalmer: pin(26.9157, 70.9083, 'Jaisalmer', 'Rajasthan'),
  delhi: pin(28.6139, 77.209, 'Delhi', 'Delhi'),
  'new delhi': pin(28.6139, 77.209, 'Delhi', 'Delhi'),
  agra: pin(27.1767, 78.0081, 'Agra', 'Uttar Pradesh'),
  rishikesh: pin(30.0869, 78.2676, 'Rishikesh', 'Uttarakhand'),
  haridwar: pin(29.9457, 78.1642, 'Haridwar', 'Uttarakhand'),
  dehradun: pin(30.3165, 78.0322, 'Dehradun', 'Uttarakhand'),
  varanasi: pin(25.3176, 82.9739, 'Varanasi', 'Uttar Pradesh'),
  srinagar: pin(34.0837, 74.7973, 'Srinagar', 'Jammu and Kashmir'),
  kashmir: pin(34.0837, 74.7973, 'Srinagar', 'Jammu and Kashmir'),
  gulmarg: pin(34.0484, 74.3805, 'Gulmarg', 'Jammu and Kashmir'),
  pahalgam: pin(34.0161, 75.3152, 'Pahalgam', 'Jammu and Kashmir'),
  lidder: pin(34.02, 75.33, 'Pahalgam', 'Jammu and Kashmir', 'Lidder valley, Pahalgam'),
  leh: pin(34.1526, 77.5771, 'Leh', 'Ladakh'),
  ladakh: pin(34.1526, 77.5771, 'Leh', 'Ladakh'),
  dharamshala: pin(32.219, 76.3234, 'Dharamshala', 'Himachal Pradesh'),
  kochi: pin(9.9312, 76.2673, 'Kochi', 'Kerala'),
  cochin: pin(9.9312, 76.2673, 'Kochi', 'Kerala'),
  munnar: pin(10.0889, 77.0595, 'Munnar', 'Kerala'),
  alleppey: pin(9.4981, 76.3388, 'Alleppey', 'Kerala'),
  alappuzha: pin(9.4981, 76.3388, 'Alleppey', 'Kerala'),
  kerala: pin(9.9312, 76.2673, 'Kochi', 'Kerala'),
  pondicherry: pin(11.9416, 79.8083, 'Pondicherry', 'Puducherry'),
  puducherry: pin(11.9416, 79.8083, 'Pondicherry', 'Puducherry'),
  chennai: pin(13.0827, 80.2707, 'Chennai', 'Tamil Nadu'),
  hampi: pin(15.335, 76.46, 'Hampi', 'Karnataka'),
  bengaluru: pin(12.9716, 77.5946, 'Bengaluru', 'Karnataka'),
  bangalore: pin(12.9716, 77.5946, 'Bengaluru', 'Karnataka'),
  mysuru: pin(12.2958, 76.6394, 'Mysuru', 'Karnataka'),
  mysore: pin(12.2958, 76.6394, 'Mysuru', 'Karnataka'),
  hyderabad: pin(17.385, 78.4867, 'Hyderabad', 'Telangana'),
  kolkata: pin(22.5726, 88.3639, 'Kolkata', 'West Bengal'),
  darjeeling: pin(27.036, 88.2627, 'Darjeeling', 'West Bengal'),
  gangtok: pin(27.3389, 88.6065, 'Gangtok', 'Sikkim'),
  amritsar: pin(31.634, 74.8723, 'Amritsar', 'Punjab'),
  pune: pin(18.5204, 73.8567, 'Pune', 'Maharashtra'),
  ooty: pin(11.4064, 76.6932, 'Ooty', 'Tamil Nadu'),
  coorg: pin(12.3375, 75.8069, 'Coorg', 'Karnataka'),
  gokarna: pin(14.5479, 74.3188, 'Gokarna', 'Karnataka'),
  varkala: pin(8.7379, 76.7163, 'Varkala', 'Kerala'),
  kodaikanal: pin(10.2381, 77.4892, 'Kodaikanal', 'Tamil Nadu'),
  'mount abu': pin(24.5926, 72.7156, 'Mount Abu', 'Rajasthan'),
  bhuj: pin(23.242, 69.6669, 'Bhuj', 'Gujarat'),
  andaman: pin(11.6234, 92.7265, 'Port Blair', 'Andaman'),
}

export const PLACE_SEEDS: Record<string, GeoPoint> = {
  'dal lake': pin(34.106, 74.868, 'Srinagar', 'Jammu and Kashmir', 'Dal Lake, Srinagar'),
  houseboat: pin(34.091, 74.842, 'Srinagar', 'Jammu and Kashmir', 'Dal houseboats, Srinagar'),
  nishat: pin(34.1248, 74.8792, 'Srinagar', 'Jammu and Kashmir', 'Nishat Bagh, Srinagar'),
  shalimar: pin(34.1486, 74.8733, 'Srinagar', 'Jammu and Kashmir', 'Shalimar Bagh, Srinagar'),
  ahdoos: pin(34.0724, 74.8186, 'Srinagar', 'Jammu and Kashmir', 'Ahdoos, Residency Road'),
  hazratbal: pin(34.129, 74.842, 'Srinagar', 'Jammu and Kashmir', 'Hazratbal, Srinagar'),
  'floating market': pin(34.089, 74.855, 'Srinagar', 'Jammu and Kashmir', 'Dal floating market'),
  gondola: pin(34.0484, 74.3805, 'Gulmarg', 'Jammu and Kashmir', 'Gulmarg gondola'),
  lidder: pin(34.02, 75.33, 'Pahalgam', 'Jammu and Kashmir', 'Lidder valley'),
  'taj cidade de goa': pin(15.458, 73.804, 'Goa', 'Goa', 'Taj Cidade de Goa, Vainguinim'),
  'novotel goa': pin(15.538, 73.764, 'Candolim', 'Goa', 'Novotel Goa Candolim'),
  'novotel candolim': pin(15.538, 73.764, 'Candolim', 'Goa', 'Novotel Goa Candolim'),
  'fern residency': pin(19.136, 72.827, 'Mumbai', 'Maharashtra', 'The Fern, Andheri, Mumbai'),
  trishna: pin(18.932, 72.833, 'Mumbai', 'Maharashtra', 'Trishna, Fort, Mumbai'),
  'marine drive': pin(18.943, 72.823, 'Mumbai', 'Maharashtra', 'Marine Drive, Mumbai'),
  'gateway of india': pin(18.922, 72.8347, 'Mumbai', 'Maharashtra', 'Gateway of India'),
  'fort aguada': pin(15.4924, 73.7732, 'Goa', 'Goa', 'Fort Aguada'),
  chapora: pin(15.603, 73.736, 'Goa', 'Goa', 'Chapora Fort'),
  fontainhas: pin(15.498, 73.83, 'Panaji', 'Goa', 'Fontainhas, Panaji'),
  'old goa': pin(15.5036, 73.9116, 'Goa', 'Goa', 'Old Goa churches'),
  'city palace': pin(26.9258, 75.8236, 'Jaipur', 'Rajasthan', 'City Palace, Jaipur'),
  'taj mahal': pin(27.1751, 78.0421, 'Agra', 'Uttar Pradesh', 'Taj Mahal, Agra'),
  'india gate': pin(28.6129, 77.2295, 'Delhi', 'Delhi', 'India Gate'),
  'golden temple': pin(31.62, 74.8765, 'Amritsar', 'Punjab', 'Golden Temple'),
}

const ALL_SEEDS = { ...CITY_SEEDS, ...PLACE_SEEDS }

function tokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2)
}

export function seedLookup(query: string): GeoPoint | null {
  const key = query.trim().toLowerCase()
  if (!key) return null
  if (ALL_SEEDS[key]) return ALL_SEEDS[key]
  const words = new Set(tokens(key))
  const ranked = Object.entries(ALL_SEEDS).sort((a, b) => b[0].length - a[0].length)
  for (const [name, point] of ranked) {
    const nameWords = tokens(name)
    if (nameWords.length && nameWords.every((word) => words.has(word))) return point
    if (name.length >= 5 && key.includes(name)) return point
  }
  return null
}

export function citySeed(city: string): GeoPoint | null {
  return CITY_SEEDS[city.trim().toLowerCase()] ?? seedLookup(city)
}
