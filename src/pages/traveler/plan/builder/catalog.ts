import { addDays, format, parseISO } from 'date-fns'
import { routeCities, tripDuration } from '@/lib/plan'
import type { TripNode } from '@/types'
import type { TripPlan } from '@/types/plan'

export const SOFT_DELTA = 500

export type HopKind = 'cab' | 'train' | 'flight' | 'stay' | 'food' | 'activity' | 'return'

export interface HopOption {
  id: string
  name: string
  price: number
  tag: 'recommended' | 'budget' | 'save' | 'comfort'
  summary: string
  description: string
  time: string
  duration: string
  patch?: Partial<TripNode>
}

export interface PlanHop {
  id: string
  day: number
  city: string
  category: TripNode['category']
  nodeId?: string
  kind: HopKind
  narrator: string
  question: string
  options: HopOption[]
}

function dateFor(plan: TripPlan, day: number) {
  return format(addDays(parseISO(plan.startDate), Math.max(0, day - 1)), 'yyyy-MM-dd')
}

export function hopsFor(plan: TripPlan): PlanHop[] {
  const cities = routeCities(plan)
  const westCoast = cities.includes('Mumbai') && cities.includes('Goa')
  return (westCoast ? westCoastHops() : genericHops(plan)).map((hop) => ({
    ...hop,
    options: hop.options.map((option) => ({ ...option })),
  }))
}

export function hopDate(plan: TripPlan, hop: PlanHop) {
  return dateFor(plan, hop.day)
}

function westCoastHops(): PlanHop[] {
  return [
    {
      id: 'home-cab',
      day: 1,
      city: 'Ahmedabad',
      category: 'transport',
      kind: 'cab',
      narrator: 'You start from home in Navrangpura. The first move is a cab to Kalupur railway station.',
      question: 'Which cab should take you to Kalupur?',
      options: [
        {
          id: 'cab-hatch',
          name: 'City hatchback · Navrangpura → Kalupur',
          price: 320,
          tag: 'save',
          time: '04:40 – 05:10',
          duration: '30 min',
          summary: 'Lowest fare. Tight with two large bags.',
          description:
            'Shared-fleet hatchback from Navrangpura at 04:40. 28–35 minutes in early traffic. Fits two cabin bags. Cheapest way to hit Kalupur before the 06:10 Vande Bharat.',
        },
        {
          id: 'cab-uber',
          name: 'Uber Comfort / Meru sedan',
          price: 480,
          tag: 'recommended',
          time: '04:40 – 05:15',
          duration: '35 min',
          summary: 'AC sedan, boot space for 2 adults, pickup buffer held.',
          description:
            'Sedan hold with a named driver. Leaves Navrangpura at 04:40, Kalupur drop at platform 1 side. ₹480 for two. Recommended because it keeps the 45-minute station buffer without a premium Innova.',
        },
        {
          id: 'cab-innova',
          name: 'Innova Crysta airport-style',
          price: 980,
          tag: 'comfort',
          time: '04:35 – 05:10',
          duration: '35 min',
          summary: 'Extra space and a quieter cabin. Adds more than ₹500 vs the sedan.',
          description:
            'Full Innova from home. Comfortable, but ₹500 above the sedan. Use this if you have hard cases or want a hotel-style pickup. Not required for two cabin bags.',
        },
      ],
    },
    {
      id: 'kalupur-train',
      day: 1,
      city: 'Ahmedabad',
      category: 'transport',
      nodeId: 'n1',
      kind: 'train',
      narrator: 'You have reached Kalupur station. Next you need a train toward Mumbai.',
      question: 'Which train (or flight) should carry Day 1?',
      options: [
        {
          id: 'train-vb',
          name: 'Vande Bharat 22925 · 2A to Mumbai',
          price: 4280,
          tag: 'recommended',
          time: '06:10 – 12:25',
          duration: '6h 15m',
          summary: 'Reserved 2A A1-22/23. Punctual corridor, matches the Fern check-in.',
          description:
            'Vande Bharat 22925 from Kalupur at 06:10, Bandra Terminus 12:25. Two 2A seats. Catering included. This is the live green hop on the West Coast Circuit because it holds the 14:00 Andheri check-in without a flight premium.',
        },
        {
          id: 'train-mail',
          name: 'Gujarat Mail · sleeper / 3A',
          price: 1840,
          tag: 'save',
          time: '22:00 – 08:10',
          duration: '10h 10m',
          summary: 'Overnight save. Arrives later — evening Chowpatty still works.',
          description:
            'Cheapest reliable rail hop. Leaves the night before or as a late 15 Oct mail depending on berth. Adds sleep time, loses the Marine Drive sunset if the train slips. Save about ₹2,400 vs Vande Bharat.',
        },
        {
          id: 'train-tejas',
          name: 'Tejas Express · 1A',
          price: 6120,
          tag: 'comfort',
          time: '06:40 – 13:20',
          duration: '6h 40m',
          summary: 'Quieter coach, higher fare. Crosses the ₹500 comfort line.',
          description:
            '1A Tejas with meals. Slightly later arrival than Vande Bharat. The extra ₹1,840 vs 2A is a comfort spend, not a feasibility spend.',
        },
        {
          id: 'flight-amd-bom',
          name: 'IndiGo AMD → BOM morning',
          price: 7680,
          tag: 'comfort',
          time: '07:15 – 08:35',
          duration: '1h 20m + airport',
          summary: 'Fastest door-to-door if you skip Kalupur. Adds more than ₹500.',
          description:
            'SVPI → BOM Terminal 2. You would not use Kalupur. Adds airport cab and a 2-hour report time. Use as an alternative if Western Railway fog is flagged.',
        },
      ],
    },
    {
      id: 'mumbai-stay',
      day: 1,
      city: 'Mumbai',
      category: 'stay',
      nodeId: 'n2',
      kind: 'stay',
      narrator: 'You are in Mumbai. Day 1 ends at a hotel — this is the biggest stay decision of the circuit.',
      question: 'Where should you check in tonight?',
      options: [
        {
          id: 'stay-fern',
          name: 'The Fern Residency, Andheri',
          price: 7600,
          tag: 'recommended',
          time: '14:00',
          duration: '2 nights',
          summary: 'Deluxe twin, breakfast, 12 minutes from the evening hop.',
          description:
            'Premium 3-star / 4-star that matches your brief. Breakfast included, late checkout request window, airport-road access. Within the stay allocation for 2 adults.',
        },
        {
          id: 'stay-ibis',
          name: 'Ibis Mumbai Airport',
          price: 5200,
          tag: 'save',
          time: '14:00',
          duration: '2 nights',
          summary: 'Clean, closer to the airport, farther from Chowpatty.',
          description:
            'Saves ₹2,400 vs the Fern. You trade evening walkability for a shorter Day 3 airport hop. Feasible if you prefer sleep over Colaba time.',
        },
        {
          id: 'stay-taj',
          name: 'Taj Lands End, Bandra',
          price: 14200,
          tag: 'comfort',
          time: '15:00',
          duration: '2 nights',
          summary: 'Sea-link views. Crosses the ₹500 comfort line by a wide margin.',
          description:
            'Luxury hold. Photography is excellent. It pulls ₹6,600 out of the Goa stay budget. Keep as an alternative, not the green path, unless you raise the ceiling.',
        },
      ],
    },
    {
      id: 'mumbai-evening',
      day: 1,
      city: 'Mumbai',
      category: 'food',
      nodeId: 'n3',
      kind: 'food',
      narrator: 'Check-in is done. The light is going. Let’s place the first food + photography block.',
      question: 'How should Day 1 evening land?',
      options: [
        {
          id: 'eve-chowpatty',
          name: 'Marine Drive sunset + Chowpatty street food',
          price: 900,
          tag: 'recommended',
          time: '17:30 – 20:30',
          duration: '3h',
          summary: 'Bhel, pav bhaji, kulfi. Matches Food + Photography.',
          description:
            'Cab to Marine Drive, walk the queen’s necklace, then Chowpatty stalls. ₹900 for two. This is the green evening because it is local, cheap, and timed after the 14:00 check-in.',
        },
        {
          id: 'eve-walk',
          name: 'Marine Drive walk only',
          price: 0,
          tag: 'save',
          time: '17:45 – 19:00',
          duration: '75 min',
          summary: 'No spend. You skip the food node.',
          description:
            'Sunset frames without the stall spend. Save ₹900. Add a hotel dinner later if you get hungry.',
        },
        {
          id: 'eve-trident',
          name: 'Trident Nariman Point dinner',
          price: 2800,
          tag: 'comfort',
          time: '19:30 – 21:30',
          duration: '2h',
          summary: 'Fine dining. Adds more than ₹500 vs Chowpatty.',
          description:
            'Reserved two-top. Strong if you picked Fine Dining. It spends the food buffer early.',
        },
      ],
    },
    {
      id: 'mumbai-lunch',
      day: 2,
      city: 'Mumbai',
      category: 'food',
      nodeId: 'n5',
      kind: 'food',
      narrator: 'Day 2 morning is the Gateway walk — that is open and free. Lunch is the paid decision.',
      question: 'Where do you eat after Colaba?',
      options: [
        {
          id: 'lunch-trishna',
          name: 'Lunch at Trishna, Fort',
          price: 3200,
          tag: 'recommended',
          time: '13:30',
          duration: '90 min',
          summary: 'Butter garlic crab for two. Reservation held.',
          description:
            'Fort seafood that matches a Food-first brief. Walkable from Colaba. ₹3,200 is the planned meal, not an upsell.',
        },
        {
          id: 'lunch-thali',
          name: 'Fort vegetarian thali',
          price: 700,
          tag: 'save',
          time: '13:15',
          duration: '60 min',
          summary: 'Local, fast, keeps the Carter Road window.',
          description:
            'Saves ₹2,500. Still local. Use if you want more budget for Baga.',
        },
        {
          id: 'lunch-fine',
          name: 'Taj Wellington Pier lunch',
          price: 4100,
          tag: 'comfort',
          time: '13:45',
          duration: '2h',
          summary: 'Harbour table. Adds more than ₹500 vs Trishna.',
          description:
            'Beautiful, slow, and it compresses the Bandra evening. Keep as an alternative.',
        },
      ],
    },
    {
      id: 'mumbai-goa',
      day: 3,
      city: 'Mumbai',
      category: 'transport',
      nodeId: 'n7',
      kind: 'flight',
      narrator: 'Day 3 you leave Mumbai for Goa. This hop decides the Candolim check-in.',
      question: 'How do you go Mumbai → Goa?',
      options: [
        {
          id: 'goi-indigo',
          name: 'IndiGo 6E 5121 BOM → GOI',
          price: 7400,
          tag: 'recommended',
          time: '08:15 – 09:25',
          duration: '70 min',
          summary: 'Cabin bags, T2, web check-in done. Holds noon check-in.',
          description:
            'The live corridor hop. 08:15 departure, Dabolim 09:25, Novotel by 12:00 with buffer.',
        },
        {
          id: 'goi-train',
          name: 'Konkan Railway · Mumbai → Goa',
          price: 2100,
          tag: 'save',
          time: '07:10 – 15:50',
          duration: '8h 40m',
          summary: 'Saves ₹5,300. Check-in slips to late afternoon.',
          description:
            'Cheapest reliable hop if you can spend the morning on the train. Creates a 25-minute timing gap at Candolim unless dinner moves.',
        },
        {
          id: 'goi-bus',
          name: 'Overnight sleeper coach',
          price: 3700,
          tag: 'budget',
          time: '19:00 – 07:30',
          duration: '12h',
          summary: 'Saves a hotel night if you accept a tighter morning.',
          description:
            'Leaves Day 2 night. You arrive Goa on Day 3 morning without the flight. Feasibility is lower on punctuality.',
        },
      ],
    },
    {
      id: 'goa-stay',
      day: 3,
      city: 'Candolim',
      category: 'stay',
      nodeId: 'n8',
      kind: 'stay',
      narrator: 'Goa nights are the largest line on the budget. Treat this like you are placing the stay yourself.',
      question: 'Which Goa hotel should hold 4 nights?',
      options: [
        {
          id: 'goa-novotel',
          name: 'Novotel Goa Resort & Spa, Candolim',
          price: 18800,
          tag: 'recommended',
          time: '12:00',
          duration: '4 nights',
          summary: 'Garden view, breakfast + dinner. Waitlist risk is already on the desk.',
          description:
            'Matches Premium stay. Close to Baga and Aguada. Inventory can go yellow — that is why Taj Cidade sits as an alternative.',
        },
        {
          id: 'goa-taj',
          name: 'Taj Cidade de Goa, Vainguinim',
          price: 16400,
          tag: 'save',
          time: '13:00',
          duration: '4 nights',
          summary: 'Saves ₹2,400. Quieter cliff, longer Baga transfer.',
          description:
            'Confirmed garden-view inventory. Better if Novotel waitlist stays red. Adds 25 minutes to Baga.',
        },
        {
          id: 'goa-calangute',
          name: 'Mid-range Calangute boutique',
          price: 9200,
          tag: 'budget',
          time: '12:30',
          duration: '4 nights',
          summary: 'Largest stay save. Drops half-board.',
          description:
            'Saves ₹9,600 vs Novotel. You buy dinners separately. Fits a tighter ceiling.',
        },
      ],
    },
    {
      id: 'baga',
      day: 4,
      city: 'Baga',
      category: 'activity',
      nodeId: 'n10',
      kind: 'activity',
      narrator: 'Day 4 morning is the outdoor risk. Place the activity the way you would if you were standing in Baga.',
      question: 'What do you do with the Baga morning?',
      options: [
        {
          id: 'baga-water',
          name: 'Baga water sports combo',
          price: 3600,
          tag: 'recommended',
          time: '09:30 – 12:30',
          duration: '3h',
          summary: 'Parasailing + jet ski. Matches Adventure + Beach.',
          description:
            'Certified operator. Weather-sensitive. This is the node the live twin watches for swell.',
        },
        {
          id: 'baga-cook',
          name: 'Indoor cooking class',
          price: 1800,
          tag: 'save',
          time: '11:00 – 13:00',
          duration: '2h',
          summary: 'Rain-safe food swap. Same lunch window.',
          description:
            'The Digital Twin alternative if swell goes red. Saves ₹1,800 and keeps Food on the path.',
        },
        {
          id: 'baga-walk',
          name: 'Fort Aguada walk only',
          price: 0,
          tag: 'budget',
          time: '09:00 – 11:30',
          duration: '2.5h',
          summary: 'Free photography morning. No water sports.',
          description:
            'Open if you want to bank budget. Aguada is already on Day 3 evening in the stock circuit — this replaces the paid slot.',
        },
      ],
    },
    {
      id: 'spice',
      day: 4,
      city: 'Ponda',
      category: 'food',
      nodeId: 'n11',
      kind: 'food',
      narrator: 'Afternoon: you can stay on the coast or go inland for spice and a thali.',
      question: 'Where does Day 4 lunch go?',
      options: [
        {
          id: 'spice-farm',
          name: 'Spice plantation lunch, Ponda',
          price: 1600,
          tag: 'recommended',
          time: '13:30 – 16:00',
          duration: '2.5h',
          summary: 'Goan thali, plantation walk. Food + Nature.',
          description:
            'Sahakari-style hold. Works after a 12:30 beach finish. ₹1,600 for two.',
        },
        {
          id: 'spice-shack',
          name: 'Baga beach shack',
          price: 900,
          tag: 'save',
          time: '13:00 – 14:30',
          duration: '90 min',
          summary: 'Stay on the sand. Save ₹700.',
          description:
            'No inland transfer. Good if the morning already ran long.',
        },
      ],
    },
    {
      id: 'return-amd',
      day: 7,
      city: 'Goa',
      category: 'transport',
      nodeId: 'n15',
      kind: 'return',
      narrator: 'Last hop: get home to Ahmedabad. Checkout is 11:00 — keep the Dabolim buffer.',
      question: 'How do you return on the last day?',
      options: [
        {
          id: 'ret-indigo',
          name: 'IndiGo 6E 6084 GOI → AMD',
          price: 8100,
          tag: 'recommended',
          time: '16:40 – 18:15',
          duration: '95 min',
          summary: 'Hotel checkout 11:00, traffic buffer to Dabolim.',
          description:
            'The stock return. Afternoon flight so Palolem / spa still fits Day 6.',
        },
        {
          id: 'ret-train',
          name: 'Madgaon → Ahmedabad rail + cab',
          price: 4200,
          tag: 'save',
          time: '15:10 – 08:40',
          duration: 'overnight',
          summary: 'Saves ₹3,900. You arrive home next morning.',
          description:
            'Use if you can spend one more night on the train. Changes the end-date feel, not the booked dates.',
        },
      ],
    },
  ]
}

function genericHops(plan: TripPlan): PlanHop[] {
  const dest = plan.destinations[0] ?? 'your first city'
  const { days } = tripDuration(plan)
  return [
    {
      id: 'home-cab',
      day: 1,
      city: plan.origin,
      category: 'transport',
      kind: 'cab',
      narrator: `You start from home in ${plan.origin}. First, a cab to the station or airport.`,
      question: 'Which pickup should start Day 1?',
      options: [
        {
          id: 'g-cab-save',
          name: 'City cab to the terminal',
          price: 350,
          tag: 'save',
          time: '05:00 – 05:40',
          duration: '40 min',
          summary: 'Lowest door-to-door fare.',
          description: `Hatchback from home in ${plan.origin}. Tight on luggage, honest on price.`,
        },
        {
          id: 'g-cab-rec',
          name: 'Sedan with pickup buffer',
          price: 520,
          tag: 'recommended',
          time: '04:50 – 05:40',
          duration: '50 min',
          summary: 'Recommended for 2 adults and bags.',
          description: 'AC sedan, named driver, 45-minute buffer before the long hop.',
        },
        {
          id: 'g-cab-van',
          name: 'Innova / SUV',
          price: 1100,
          tag: 'comfort',
          time: '04:50 – 05:35',
          duration: '45 min',
          summary: 'Adds more than ₹500 vs the sedan.',
          description: 'Use only if you need the extra boot.',
        },
      ],
    },
    {
      id: 'long-hop',
      day: 1,
      city: plan.origin,
      category: 'transport',
      kind: plan.transport === 'Flight' ? 'flight' : 'train',
      narrator: `You have reached the terminal. Now you need the hop to ${dest}.`,
      question: `Which ${plan.transport === 'Flight' ? 'flight' : 'train'} should we hold?`,
      options: [
        {
          id: 'g-hop-rec',
          name: plan.transport === 'Flight' ? `Morning flight to ${dest}` : `Day train to ${dest}`,
          price: plan.transport === 'Flight' ? 7200 : 4100,
          tag: 'recommended',
          time: '07:10 – 09:40',
          duration: plan.transport === 'Flight' ? '2h' : '6h',
          summary: 'Holds a afternoon hotel check-in.',
          description: `Feasible ${plan.transport.toLowerCase()} on your mixed brief, priced for ${plan.adults} adults.`,
        },
        {
          id: 'g-hop-save',
          name: `Overnight / off-peak to ${dest}`,
          price: 2400,
          tag: 'save',
          time: '21:00 – 07:30',
          duration: 'overnight',
          summary: 'Largest transport save.',
          description: 'Slower, cheaper, still feasible if you accept a later first walk.',
        },
        {
          id: 'g-hop-lux',
          name: `Premium cabin to ${dest}`,
          price: 9800,
          tag: 'comfort',
          time: '08:00 – 10:10',
          duration: '2h',
          summary: 'Adds more than ₹500 vs the recommended hop.',
          description: 'Comfort spend. Keep as an alternative unless you raised the ceiling.',
        },
      ],
    },
    {
      id: 'dest-stay',
      day: 1,
      city: dest,
      category: 'stay',
      kind: 'stay',
      narrator: `You have arrived in ${dest}. Place the hotel the way you would if you were booking it yourself.`,
      question: `Which ${plan.accommodation.toLowerCase()} stay should we hold?`,
      options: [
        {
          id: 'g-stay-rec',
          name: `${plan.accommodation} stay in ${dest}`,
          price: plan.accommodation === 'Luxury' ? 16000 : plan.accommodation === 'Budget' ? 4800 : 8200,
          tag: 'recommended',
          time: '14:00',
          duration: `${Math.max(1, days - 1)} nights`,
          summary: `Matches the ${plan.accommodation} brief.`,
          description: 'Breakfast included, walkable to the first evening node.',
        },
        {
          id: 'g-stay-save',
          name: `Value lodge in ${dest}`,
          price: 3900,
          tag: 'save',
          time: '14:00',
          duration: `${Math.max(1, days - 1)} nights`,
          summary: 'Saves the stay allocation for food and activities.',
          description: 'Clean, farther from the centre, honest on price.',
        },
        {
          id: 'g-stay-lux',
          name: `Headline hotel in ${dest}`,
          price: 18500,
          tag: 'comfort',
          time: '15:00',
          duration: `${Math.max(1, days - 1)} nights`,
          summary: 'Adds more than ₹500 vs the recommended stay.',
          description: 'Keep as an alternative if the brief stays Premium, not Luxury.',
        },
      ],
    },
    {
      id: 'dest-food',
      day: 1,
      city: dest,
      category: 'food',
      kind: 'food',
      narrator: 'Evening: eat the way your brief asked — local first, unless you picked fine dining.',
      question: 'What is the first meal on the path?',
      options: [
        {
          id: 'g-food-local',
          name: `Local dinner in ${dest}`,
          price: 1200,
          tag: 'recommended',
          time: '19:00',
          duration: '90 min',
          summary: 'Street or regional kitchen for two.',
          description: 'Matches Local / Street Food on the brief.',
        },
        {
          id: 'g-food-save',
          name: 'Hotel kitchen only',
          price: 0,
          tag: 'save',
          time: '20:00',
          duration: '60 min',
          summary: 'Included if the stay has dinner.',
          description: 'Zero extra spend.',
        },
        {
          id: 'g-food-fine',
          name: 'Fine dining table',
          price: 3600,
          tag: 'comfort',
          time: '20:00',
          duration: '2h',
          summary: 'Adds more than ₹500 vs the local table.',
          description: 'Use if Fine Dining is on the brief.',
        },
      ],
    },
  ]
}
