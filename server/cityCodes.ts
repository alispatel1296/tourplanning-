/** Airport + rail codes for live flight / train search. Hill towns use a gateway when the local strip is thin. */
export const IATA: Record<string, string> = {
  ahmedabad: 'AMD',
  mumbai: 'BOM',
  bombay: 'BOM',
  goa: 'GOI',
  panaji: 'GOI',
  jaipur: 'JAI',
  udaipur: 'UDR',
  delhi: 'DEL',
  kochi: 'COK',
  kerala: 'COK',
  bangalore: 'BLR',
  bengaluru: 'BLR',
  chennai: 'MAA',
  hyderabad: 'HYD',
  kolkata: 'CCU',
  pune: 'PNQ',
  varanasi: 'VNS',
  shimla: 'SLV',
  manali: 'KUU',
  kullu: 'KUU',
  leh: 'IXL',
  dharamshala: 'DHM',
  'mcleod ganj': 'DHM',
  chandigarh: 'IXC',
  dehradun: 'DED',
  rishikesh: 'DED',
  haridwar: 'DED',
  amritsar: 'ATQ',
  srinagar: 'SXR',
  kashmir: 'SXR',
  jammu: 'IXJ',
  pondicherry: 'PNY',
  puducherry: 'PNY',
  coimbatore: 'CJB',
  madurai: 'IXM',
  lucknow: 'LKO',
  bhopal: 'BHO',
  indore: 'IDR',
  nagpur: 'NAG',
  patna: 'PAT',
  ranchi: 'IXR',
  bhubaneswar: 'BBI',
  guwahati: 'GAU',
  bagdogra: 'IXB',
  darjeeling: 'IXB',
  gangtok: 'IXB',
  'port blair': 'IXZ',
  andaman: 'IXZ',
  jodhpur: 'JDH',
  jaisalmer: 'JSA',
  agra: 'AGR',
  mysuru: 'MYQ',
  mysore: 'MYQ',
  ooty: 'CJB',
  coorg: 'IXE',
  kodagu: 'IXE',
  gokarna: 'GOX',
  varkala: 'TRV',
  kodaikanal: 'CJB',
  'mount abu': 'UDR',
  bhuj: 'BHJ',
  kutch: 'BHJ',
}

/** When the town strip is seasonal, search this airport too. */
export const GATEWAY: Record<string, { iata: string; name: string }> = {
  shimla: { iata: 'IXC', name: 'Chandigarh' },
  manali: { iata: 'KUU', name: 'Kullu–Manali (Bhuntar)' },
  rishikesh: { iata: 'DED', name: 'Dehradun' },
  haridwar: { iata: 'DED', name: 'Dehradun' },
  darjeeling: { iata: 'IXB', name: 'Bagdogra' },
  gangtok: { iata: 'IXB', name: 'Bagdogra' },
  munnar: { iata: 'COK', name: 'Kochi' },
  alleppey: { iata: 'COK', name: 'Kochi' },
  alappuzha: { iata: 'COK', name: 'Kochi' },
  hampi: { iata: 'BLR', name: 'Bengaluru' },
  ooty: { iata: 'CJB', name: 'Coimbatore' },
  kodaikanal: { iata: 'CJB', name: 'Coimbatore' },
  coorg: { iata: 'BLR', name: 'Bengaluru' },
  gokarna: { iata: 'GOX', name: 'Mopa / Goa' },
  varkala: { iata: 'TRV', name: 'Thiruvananthapuram' },
  'mount abu': { iata: 'UDR', name: 'Udaipur' },
  mysuru: { iata: 'BLR', name: 'Bengaluru' },
}

export const RAIL: Record<string, string> = {
  ahmedabad: 'ADI',
  mumbai: 'BCT',
  bombay: 'BCT',
  goa: 'MAO',
  panaji: 'MAO',
  jaipur: 'JP',
  delhi: 'NDLS',
  shimla: 'SML',
  kalka: 'KLK',
  chandigarh: 'CDG',
  kochi: 'ERS',
  bengaluru: 'SBC',
  bangalore: 'SBC',
  chennai: 'MAS',
  varanasi: 'BSB',
  udaipur: 'UDZ',
  rishikesh: 'RKSH',
  haridwar: 'HW',
  dehradun: 'DDN',
}

export const CITY_PINS: Record<string, [number, number]> = {
  ahmedabad: [23.0225, 72.5714],
  mumbai: [19.076, 72.8777],
  goa: [15.4909, 73.8278],
  baga: [15.5553, 73.7517],
  candolim: [15.518, 73.763],
  jaipur: [26.9124, 75.7873],
  udaipur: [24.5854, 73.7125],
  shimla: [31.1048, 77.1734],
  manali: [32.2432, 77.1892],
  leh: [34.1526, 77.5771],
  dharamshala: [32.219, 76.3234],
  rishikesh: [30.0869, 78.2676],
  haridwar: [29.9457, 78.1642],
  dehradun: [30.3165, 78.0322],
  delhi: [28.6139, 77.209],
  chandigarh: [30.7333, 76.7794],
  kochi: [9.9312, 76.2673],
  munnar: [10.0889, 77.0595],
  alleppey: [9.4981, 76.3388],
  varanasi: [25.3176, 82.9739],
  pondicherry: [11.9416, 79.8083],
  hampi: [15.335, 76.46],
  darjeeling: [27.036, 88.2627],
  srinagar: [34.0837, 74.7973],
  kashmir: [34.0837, 74.7973],
  gulmarg: [34.0484, 74.3805],
  pahalgam: [34.0161, 75.3152],
  chennai: [13.0827, 80.2707],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  jodhpur: [26.2389, 73.0243],
  jaisalmer: [26.9157, 70.9083],
  agra: [27.1767, 78.0081],
  amritsar: [31.634, 74.8723],
  mysuru: [12.2958, 76.6394],
  hyderabad: [17.385, 78.4867],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  ooty: [11.4064, 76.6932],
  coorg: [12.3375, 75.8069],
  gokarna: [14.5479, 74.3188],
  varkala: [8.7379, 76.7163],
  kodaikanal: [10.2381, 77.4892],
  'mount abu': [24.5926, 72.7156],
  bhuj: [23.242, 69.6669],
  andaman: [11.6234, 92.7265],
  gangtok: [27.3389, 88.6065],
}

export function iataFor(city: string): string | undefined {
  return IATA[city.trim().toLowerCase()]
}

export function gatewayFor(city: string): { iata: string; name: string } | undefined {
  return GATEWAY[city.trim().toLowerCase()]
}

export function railCode(city: string): string | undefined {
  return RAIL[city.trim().toLowerCase()]
}

export function pinFor(city: string): [number, number] | undefined {
  return CITY_PINS[city.trim().toLowerCase()]
}

export async function geocodeCity(city: string): Promise<[number, number] | undefined> {
  const known = pinFor(city)
  if (known) return known
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${city}, India`)}&format=json&limit=1`
    const response = await fetch(url, { headers: { 'User-Agent': 'TripFlow/1.0 (local planner)' } })
    if (!response.ok) return undefined
    const rows = (await response.json()) as Array<{ lat: string; lon: string }>
    const row = rows[0]
    if (!row) return undefined
    return [Number(row.lat), Number(row.lon)]
  } catch {
    return undefined
  }
}
