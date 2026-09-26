import type { TripPlan } from '@/types/plan'
import { routeCities } from '@/lib/plan'

export interface CarryGroup {
  id: string
  title: string
  why: string
  items: string[]
}

export function carryAdvice(plan: TripPlan): CarryGroup[] {
  const cities = routeCities(plan)
  const goa = cities.includes('Goa')
  const mumbai = cities.includes('Mumbai')
  const cold = cities.some(c => c.toLowerCase() === 'manali' || c.toLowerCase() === 'shimla' || c.toLowerCase() === 'leh')
  const rain = goa
  return [
    {
      id: 'ids',
      title: 'Credentials to keep on you',
      why: 'Desk and station checks on this corridor still ask for a photo ID plus the PNR.',
      items: [
        'Aadhaar or passport for each adult (offline copy)',
        'Vande Bharat / flight PNR screenshots',
        'Hotel confirmation for the first night',
        'UPI plus one backup card',
        mumbai || goa ? 'Emergency desk numbers - Rohan (Goa) and Meera (ops)' : 'Operator desk number saved offline',
      ],
    },
    {
      id: 'meds',
      title: 'Medicine & health',
      why: cold ? 'Altitude and winding mountain roads can cause sickness. Pack what you normally use.' : 'Train + humidity + street food. Pack what you already use; do not invent a new kit.',
      items: [
        'Any personal prescription you normally take',
        cold ? 'Motion sickness pills for mountain roads' : 'Motion tablet if you get sick on the 6-hour rail hop',
        cold ? 'Diamox or altitude meds if advised' : 'ORS sachets for the heat',
        'Basic band-aid and antiseptic',
        goa ? 'After-sun and a small mosquito repellent' : 'A small first-aid pouch',
      ],
    },
    {
      id: 'clothes',
      title: 'Clothing for this weather',
      why: weatherLine(plan, goa, mumbai, cold),
      items: cold ? [
        'Thermal innerwear',
        'Heavy winter jacket / fleece',
        'Warm woolen socks and gloves',
        'Sturdy trekking or walking shoes',
        'Beanie / warm cap'
      ] : [
        'Light cotton for daytime',
        'Comfortable walking shoes',
        'One layer for AC coaches and hotel lobbies',
        rain ? 'A compact rain layer for the shower window' : 'A light wind layer',
        goa ? 'Swim / beach wear' : 'One smarter evening shirt',
      ],
    },
    {
      id: 'kit',
      title: 'Day-bag kit',
      why: 'These are the items people leave in the cab or the safe.',
      items: [
        'Phone + power bank + charger',
        'Room key / key card habit - check the desk tray',
        'Reusable bottle',
        cold ? 'Lip balm and cold cream' : 'Sunscreen',
        goa ? 'Dry bag for water sports' : 'Small umbrella or hat',
      ],
    },
  ]
}

function weatherLine(_plan: TripPlan, goa: boolean, mumbai: boolean, cold: boolean) {
  if (cold) return 'Cold hill destination. Temperatures can drop significantly, especially at night. Pack warm layers.'
  if (goa && mumbai) {
    return 'Starts dry and warm. Mumbai is humid. Goa is sunny with a rain possibility.'
  }
  if (goa) return 'Coastal and humid. Sun most days, one rain window. Cotton plus a compact rain layer.'
  if (mumbai) return 'Warm, humid, a lot of walking. Breathable clothes and a pair you can stand in.'
  return 'Dress for the route: light layers, walking shoes, one AC layer.'
}

export const weatherStrip = [
  { city: 'Mumbai', sky: 'Humid 31°C', note: 'Evening sea breeze. Cotton is enough.' },
  { city: 'Manali', sky: 'Cold 12°C', note: 'Chilly nights. Keep your jacket handy.' },
  { city: 'Goa', sky: 'Sun, late rain 29°C', note: 'Day 5 shower risk. Rain layer in the day bag.' },
]
