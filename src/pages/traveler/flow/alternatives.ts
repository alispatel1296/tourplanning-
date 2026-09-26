import type { TripNode } from '@/types'
import { displayCost, nodeDuration, type PathMode } from '@/pages/traveler/flow/model'

export interface NodeAlternative {
  id: string
  name: string
  rating: number
  price: number
  distance: string
  timeImpact: string
  benefit: string
  duration: string
  convenience: string
  feasibility: string
  reason: string
  createsGap: boolean
  patch: Partial<TripNode>
}

export function whyQuestion(node: TripNode) {
  if (node.category === 'stay') return 'Why this hotel?'
  if (node.category === 'transport') return 'Why this hop?'
  if (node.category === 'food') return 'Why this meal?'
  if (node.category === 'activity') return 'Why this activity?'
  return 'Why TripFlow selected this'
}

export function whySelected(node: TripNode) {
  if (node.category === 'stay') {
    return `Recommended because it is within your ₹15,000 stay budget, has a 4.5+ rating, and is 12 minutes from your next activity.`
  }
  if (node.category === 'transport') {
    return `Recommended because it holds the Day ${node.day} buffer, stays inside the transport allocation, and matches your mixed-mode brief.`
  }
  if (node.category === 'food') {
    return `Recommended because it matches your local + street-food preference and sits next to the green-path activity.`
  }
  if (node.category === 'activity') {
    return `Recommended because it fits Adventure + Photography without breaking the afternoon transfer window.`
  }
  return `Recommended because it keeps the green path feasible without adding a timing conflict.`
}

export function currentCompare(node: TripNode, path: PathMode, rating: number) {
  const waitlisted = node.id === 'n8' && node.title.includes('Novotel')
  return {
    name: node.title,
    price: displayCost(node, path),
    duration: nodeDuration(node),
    distance:
      node.category === 'transport' ? 'Direct corridor' : `${node.city} · live green path`,
    rating,
    convenience:
      node.category === 'stay'
        ? 'On the planned beach road'
        : node.category === 'transport'
          ? 'Matches the original hop'
          : 'Already on the green path',
    feasibility: waitlisted ? '72%' : '94%',
  }
}

export function includedFor(node: TripNode) {
  if (node.category === 'stay') return ['Breakfast', 'Wi-Fi', 'Late checkout request window', 'Airport-road access']
  if (node.category === 'transport') return ['Confirmed seats / PNR', 'Station or terminal transfer note', '45-minute safety buffer']
  if (node.category === 'food') return ['Table hold for 2 adults', 'Dietary note on file', 'Walkable from the previous node']
  if (node.category === 'activity') return ['Operator confirmation', 'Gear included where listed', 'Weather watch on Day 5']
  return ['Open block on the live graph']
}

export function issuesFor(node: TripNode) {
  if (node.id === 'n8' && node.title.includes('Novotel')) {
    return ['Waitlisted — inventory dropped after a MICE block.', 'Swap before 17 Oct or the red node stays live.']
  }
  if (node.category === 'transport') return ['Punctuality can slip 12 minutes on this corridor.']
  if (node.category === 'activity') return ['Outdoor slots are sensitive to the Day 5 rain watch.']
  return ['No hard conflict on this node right now.']
}

export function alternativesFor(node: TripNode): NodeAlternative[] {
  return catalogFor(node).filter((alt) => alt.name !== node.title)
}

function catalogFor(node: TripNode): NodeAlternative[] {
  if (node.category === 'transport' || node.id === 'n7') {
    return [
      {
        id: 'alt-train',
        name: 'Konkan Railway · Mumbai → Goa',
        rating: 4.3,
        price: 2100,
        distance: '580 km',
        timeImpact: '+3h 20m',
        benefit: 'Save ₹2,400',
        duration: '8h 40m',
        convenience: 'One change at Panvel',
        feasibility: '91%',
        reason: 'Cheapest reliable hop if you can spend the morning on the train.',
        createsGap: true,
        patch: {
          title: 'Konkan Railway · Mumbai → Goa',
          time: '07:10 – 15:50',
          cost: 2100,
          notes: 'Switched from flight. Adds 3h 20m; keep the Candolim check-in buffer.',
        },
      },
      {
        id: 'alt-bus',
        name: 'Overnight sleeper coach',
        rating: 4.0,
        price: 3700,
        distance: '590 km',
        timeImpact: '+45m',
        benefit: 'Save ₹800',
        duration: '12h',
        convenience: 'Sleep on board',
        feasibility: '84%',
        reason: 'Saves a hotel night if you accept a tighter morning.',
        createsGap: true,
        patch: {
          title: 'Overnight sleeper · Mumbai → Goa',
          time: '20:00 – 08:00',
          cost: 3700,
          notes: 'Coach hop. Review the 25-minute morning gap before Fort Aguada.',
        },
      },
    ]
  }

  if (node.category === 'stay') {
    return [
      {
        id: 'alt-caravela',
        name: 'Caravela Beach Resort, Varca',
        rating: 4.4,
        price: Math.max(1200, node.cost - 1200),
        distance: '38 km from Baga',
        timeImpact: '+40m transfer',
        benefit: 'Save ₹1,200',
        duration: node.notes.includes('4') ? '4 nights' : '2 nights',
        convenience: 'Quieter South Goa',
        feasibility: '95%',
        reason: 'Clears the Novotel waitlist and stays inside the stay budget.',
        createsGap: false,
        patch: {
          title: 'Caravela Beach Resort, Varca',
          cost: Math.max(1200, node.cost - 1200),
          notes: 'Garden-view swap. Longer Baga transfer, waitlist cleared.',
          status: 'upcoming',
        },
      },
      {
        id: 'alt-taj',
        name: 'Taj Fort Aguada',
        rating: 4.7,
        price: node.cost + 2400,
        distance: '8 min to fort sunset',
        timeImpact: '−10m',
        benefit: 'Closer to Day 3 sunset',
        duration: node.notes.includes('4') ? '4 nights' : '2 nights',
        convenience: 'On the headland',
        feasibility: '88%',
        reason: 'Higher rating and shorter walk to Fort Aguada, above the stay ceiling.',
        createsGap: false,
        patch: {
          title: 'Taj Fort Aguada',
          cost: node.cost + 2400,
          notes: 'Premium swap. Better rated, closer to the sunset node.',
        },
      },
      {
        id: 'alt-holiday',
        name: 'Holiday Inn Resort Goa',
        rating: 4.3,
        price: Math.max(2400, node.cost - 2400),
        distance: '18 min to Baga',
        timeImpact: '+15m',
        benefit: 'Save ₹2,400',
        duration: node.notes.includes('4') ? '4 nights' : '2 nights',
        convenience: 'Family pool, Candolim road',
        feasibility: '93%',
        reason: 'Cheaper confirmed inventory without leaving North Goa.',
        createsGap: false,
        patch: {
          title: 'Holiday Inn Resort Goa',
          cost: Math.max(2400, node.cost - 2400),
          notes: 'Confirmed rooms. Short extra transfer versus Novotel.',
          status: 'upcoming',
        },
      },
    ]
  }

  if (node.category === 'food') {
    return [
      {
        id: 'alt-thali',
        name: 'Local thali hall',
        rating: 4.2,
        price: Math.max(400, node.cost - 800),
        distance: '6 min walk',
        timeImpact: '−15m',
        benefit: 'Save ₹800',
        duration: '60 min',
        convenience: 'No reservation',
        feasibility: '96%',
        reason: 'Keeps the food brief and frees budget for Day 4.',
        createsGap: false,
        patch: {
          title: 'Local thali hall',
          cost: Math.max(400, node.cost - 800),
          notes: 'Swapped for a cheaper neighbourhood thali.',
        },
      },
      {
        id: 'alt-cover',
        name: 'Covered cafe · Fontainhas',
        rating: 4.5,
        price: node.cost,
        distance: 'Indoor',
        timeImpact: '0m',
        benefit: 'Rain-safe',
        duration: '75 min',
        convenience: 'Covered seating',
        feasibility: '94%',
        reason: 'Same spend, safer if Day 5 showers hold.',
        createsGap: false,
        patch: {
          title: 'Covered cafe · Fontainhas',
          notes: 'Indoor backup held for the rain watch.',
        },
      },
    ]
  }

  return [
    {
      id: 'alt-indoor',
      name: 'Indoor heritage slot',
      rating: 4.6,
      price: Math.max(0, node.cost - 400),
      distance: 'Covered',
      timeImpact: '0m',
      benefit: 'Weather-safe',
      duration: '2.5 hours',
      convenience: 'No swell risk',
      feasibility: '93%',
      reason: 'Keeps Adventure + Photography if the outdoor node fails.',
      createsGap: false,
      patch: {
        title: 'Indoor heritage slot',
        cost: Math.max(0, node.cost - 400),
        notes: 'Moved indoors. Same afternoon window.',
      },
    },
    {
      id: 'alt-later',
      name: 'Same activity · 15:00',
      rating: 4.5,
      price: node.cost,
      distance: node.city,
      timeImpact: '+2h',
      benefit: 'Clears morning swell',
      duration: '3 hours',
      convenience: 'Later slot',
      feasibility: '89%',
      reason: 'Holds the operator if the morning advisory stands.',
      createsGap: true,
      patch: {
        time: '15:00 – 18:00',
        notes: 'Afternoon slot. Recheck the evening meal buffer.',
      },
    },
  ]
}
