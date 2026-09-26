export type VendorCategory = 'hotel' | 'transport' | 'activity' | 'restaurant' | 'guide'
export type VendorAvail = 'Confirmed' | 'Limited' | 'Waitlist' | 'Seasonal'

export interface MarketVendor {
  id: string
  name: string
  category: VendorCategory
  city: string
  locations: string[]
  rating: number
  priceBand: string
  availability: VendorAvail
  status: 'active' | 'watch' | 'inactive'
  contact: string
  phone: string
  image: string
  about: string
  pricing: string[]
  performance: { onTime: number; disputes: number; repeats: number }
  reviews: { by: string; rating: number; text: string }[]
  cancellation: string
  documents: string[]
}

export interface VendorAssignment {
  vendorId: string
  tourId: string
  tourCode: string
  party: string
}

export interface MatchScore {
  vendorId: string
  preference: number
  budget: number
  location: number
  availability: VendorAvail
  reason: string
}

const VENDOR_KEY = 'tf-ops-vendors'
const ASSIGN_KEY = 'tf-ops-vendor-assign'

export const categoryTabs: { id: 'all' | VendorCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hotel', label: 'Hotels' },
  { id: 'transport', label: 'Transport' },
  { id: 'activity', label: 'Activities' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'guide', label: 'Guides' },
]

export const seedVendors: MarketVendor[] = [
  {
    id: 'mv-taj',
    name: 'Taj Cidade de Goa',
    category: 'hotel',
    city: 'Dona Paula',
    locations: ['Dona Paula', 'Panaji', 'Miramar'],
    rating: 4.8,
    priceBand: '₹14,000–22,000',
    availability: 'Confirmed',
    status: 'active',
    contact: 'reservations.cidade@tajhotels.com',
    phone: '+91 832 245 4545',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=70',
    about: 'Cliff-edge Taj inventory used across FIT and MICE briefs. Reusable stay block for North and mid-Goa circuits.',
    pricing: ['Garden view ₹14,000', 'Sea view ₹18,500', 'Half-board add ₹2,400'],
    performance: { onTime: 96, disputes: 1, repeats: 38 },
    reviews: [{ by: 'Horizon desk', rating: 5, text: 'Reliable allotment even on festival weekends.' }],
    cancellation: 'Free till 72h. 1 night after that.',
    documents: ['GST', 'FSSAI kitchen', 'Star classification'],
  },
  {
    id: 'mv-novotel',
    name: 'Novotel Goa Resort',
    category: 'hotel',
    city: 'Candolim',
    locations: ['Candolim', 'Calangute road'],
    rating: 4.6,
    priceBand: '₹8,800–12,500',
    availability: 'Waitlist',
    status: 'watch',
    contact: 'reservations.goa@accor.com',
    phone: '+91 832 674 8888',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=70',
    about: 'Primary North Goa block for West Coast Circuit. Currently tight after a MICE hold.',
    pricing: ['Garden view ₹8,800', 'Pool view ₹11,200', 'Half-board ₹1,800'],
    performance: { onTime: 90, disputes: 3, repeats: 22 },
    reviews: [{ by: 'Aarav Shah file', rating: 4, text: 'Location is right; inventory dropped mid-brief.' }],
    cancellation: 'Free till 48h. Waitlist releases do not hold.' ,
    documents: ['GST', 'Accor contract'],
  },
  {
    id: 'mv-fern',
    name: 'The Fern Residency Andheri',
    category: 'hotel',
    city: 'Mumbai',
    locations: ['Andheri East', 'WEH'],
    rating: 4.5,
    priceBand: '₹7,200–9,400',
    availability: 'Confirmed',
    status: 'active',
    contact: 'andheri@fernhotels.com',
    phone: '+91 22 6124 1234',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=70',
    about: 'Airport-road stay reused on every Ahmedabad–Mumbai hop.',
    pricing: ['Deluxe twin ₹7,200', 'Breakfast included'],
    performance: { onTime: 93, disputes: 0, repeats: 41 },
    reviews: [{ by: 'Ops', rating: 5, text: 'Check-in after 14:00 never slips the Vande Bharat day.' }],
    cancellation: 'Free till 24h.',
    documents: ['GST'],
  },
  {
    id: 'mv-mmt',
    name: 'MakeMyTrip Cabs Goa',
    category: 'transport',
    city: 'Goa',
    locations: ['Dabolim', 'Mopa', 'North Goa', 'South Goa'],
    rating: 4.3,
    priceBand: '₹18–28/km',
    availability: 'Confirmed',
    status: 'active',
    contact: 'corporate.cabs@makemytrip.com',
    phone: '+91 0124 462 8747',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa1f927ffb6?auto=format&fit=crop&w=900&q=70',
    about: 'Statewide cab desk. Assign once; reuse across every Goa FIT and group.',
    pricing: ['Airport ₹1,800', 'Full day 8h ₹3,400', 'Intercity Goa ₹18/km'],
    performance: { onTime: 88, disputes: 4, repeats: 29 },
    reviews: [{ by: 'Riya desk', rating: 4, text: 'Mopa mornings need a 20-min extra buffer.' }],
    cancellation: 'Free till 4h before pickup.',
    documents: ['All-India permit', 'GST'],
  },
  {
    id: 'mv-indigo',
    name: 'IndiGo Corporate',
    category: 'transport',
    city: 'Pan-India',
    locations: ['BOM', 'GOI', 'AMD'],
    rating: 4.3,
    priceBand: '₹4,500–9,200',
    availability: 'Limited',
    status: 'active',
    contact: 'corporate@goindigo.in',
    phone: '0124 617 3838',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=70',
    about: 'Seat blocks on BOM–GOI and GOI–AMD. Reusable air hop for west-coast products.',
    pricing: ['BOM–GOI from ₹4,500', 'GOI–AMD from ₹8,100'],
    performance: { onTime: 91, disputes: 2, repeats: 50 },
    reviews: [{ by: 'Air desk', rating: 4, text: 'Cabin-bag policy is clean for 2-adult FITs.' }],
    cancellation: 'Airline fare rules. Blocks release T-24h.',
    documents: ['BSP', 'Corporate agreement'],
  },
  {
    id: 'mv-kayak',
    name: 'Goa Kayaking Adventures',
    category: 'activity',
    city: 'Chapora',
    locations: ['Chapora', 'Mandovi', 'Palolem'],
    rating: 4.7,
    priceBand: '₹1,200–2,400',
    availability: 'Confirmed',
    status: 'active',
    contact: 'hello@goakayak.in',
    phone: '+91 98221 33410',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=70',
    about: 'Guided kayak slots that swap for beach sports when swell is up.',
    pricing: ['Mangrove 90 min ₹1,200', 'Sunset pair ₹2,400'],
    performance: { onTime: 94, disputes: 0, repeats: 17 },
    reviews: [{ by: 'Field', rating: 5, text: 'Best indoor-adjacent adventure when Baga is red.' }],
    cancellation: 'Weather cancellations are free. Guest no-show 50%.',
    documents: ['Boat licence', 'Insurance'],
  },
  {
    id: 'mv-baga',
    name: 'Baga Water Sports',
    category: 'activity',
    city: 'Baga',
    locations: ['Baga', 'Calangute'],
    rating: 4.7,
    priceBand: '₹1,500–3,800',
    availability: 'Limited',
    status: 'active',
    contact: 'anjali@bagawater.in',
    phone: '+91 98221 66740',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=70',
    about: 'Parasail + jet ski combo used on Day 4 of West Coast Circuit.',
    pricing: ['Combo ₹3,600', 'Jet ski only ₹1,500'],
    performance: { onTime: 84, disputes: 2, repeats: 14 },
    reviews: [{ by: 'Anjali Naik', rating: 4, text: 'Swell advisory can push the slot to 15:00.' }],
    cancellation: 'IMD swell = free move. Guest cancel 24h 30%.',
    documents: ['Coastal permit', 'Insurance'],
  },
  {
    id: 'mv-wharf',
    name: "Fisherman's Wharf",
    category: 'restaurant',
    city: 'Cortalim',
    locations: ['Cortalim', 'Mobor'],
    rating: 4.5,
    priceBand: '₹1,800–3,200',
    availability: 'Confirmed',
    status: 'active',
    contact: 'bookings@fishermanswharf.in',
    phone: '+91 832 255 5091',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=70',
    about: 'Riverside Goan kitchen. Reusable food node for premium + beach briefs.',
    pricing: ['Set for 2 ₹2,400', 'Seafood tower ₹3,200'],
    performance: { onTime: 92, disputes: 1, repeats: 26 },
    reviews: [{ by: 'Food desk', rating: 5, text: 'Holds 19:30 tables for FIT pairs without a chase.' }],
    cancellation: 'Free till 16:00 same day.',
    documents: ['FSSAI', 'GST'],
  },
  {
    id: 'mv-trishna',
    name: 'Trishna',
    category: 'restaurant',
    city: 'Mumbai',
    locations: ['Fort', 'Kala Ghoda'],
    rating: 4.8,
    priceBand: '₹2,800–4,500',
    availability: 'Limited',
    status: 'active',
    contact: 'reservations@trishna.co.in',
    phone: '+91 22 2270 3246',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=70',
    about: 'Signature crab lunch on the Mumbai night of the west-coast product.',
    pricing: ['Butter garlic crab ₹3,200'],
    performance: { onTime: 89, disputes: 0, repeats: 19 },
    reviews: [{ by: 'Ops', rating: 5, text: 'Need 48h for a window table.' }],
    cancellation: 'Free till 10:00 same day.',
    documents: ['FSSAI'],
  },
  {
    id: 'mv-rohan-guide',
    name: 'Rohan Desai · Goa desk guide',
    category: 'guide',
    city: 'Goa',
    locations: ['Candolim', 'Panaji', 'Old Goa', 'Baga'],
    rating: 4.8,
    performance: { onTime: 97, disputes: 0, repeats: 44 },
    priceBand: '₹3,500–6,000 / day',
    availability: 'Confirmed',
    status: 'active',
    contact: 'rohan@horizontrails.in',
    phone: '+91 83224 90811',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=70',
    about: 'On-duty coordinator who also guides photography and food walks. Assign across any Goa FIT.',
    pricing: ['Half day ₹3,500', 'Full day ₹6,000'],
    reviews: [{ by: 'Priya desk', rating: 5, text: 'Same person can own SOS and the Fontainhas walk.' }],
    cancellation: 'Free till 18:00 previous day.',
    documents: ['Guide licence', 'Police verification'],
  },
  {
    id: 'mv-sana-guide',
    name: 'Sana Qureshi · Mumbai walks',
    category: 'guide',
    city: 'Mumbai',
    locations: ['Colaba', 'Bandra', 'Fort'],
    rating: 4.6,
    priceBand: '₹2,800–5,000 / day',
    availability: 'Seasonal',
    status: 'active',
    contact: 'sana@horizontrails.in',
    phone: '+91 98200 44119',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=70',
    about: 'City walk + food guide for the Mumbai night. Seasonal on IPL weeks.',
    pricing: ['Colaba 3h ₹2,800', 'Full day ₹5,000'],
    performance: { onTime: 95, disputes: 0, repeats: 21 },
    reviews: [{ by: 'Mumbai desk', rating: 4, text: 'Best for photography pairs, not nightlife.' }],
    cancellation: 'Free till 12:00 previous day.',
    documents: ['Guide licence'],
  },
]

export function loadVendors(): MarketVendor[] {
  const raw = localStorage.getItem(VENDOR_KEY)
  if (!raw) return seedVendors
  try {
    const extra = JSON.parse(raw) as MarketVendor[]
    const overrides = new Map(extra.map((item) => [item.id, item]))
    const seeds = seedVendors.map((item) => overrides.get(item.id) ?? item)
    const seededIds = new Set(seedVendors.map((item) => item.id))
    return [...seeds, ...extra.filter((item) => !seededIds.has(item.id))]
  } catch {
    return seedVendors
  }
}

export function persistVendor(vendor: MarketVendor) {
  const raw = localStorage.getItem(VENDOR_KEY)
  const extra = raw ? (JSON.parse(raw) as MarketVendor[]) : []
  localStorage.setItem(VENDOR_KEY, JSON.stringify([vendor, ...extra.filter((item) => item.id !== vendor.id)]))
}

const seedAssignments: VendorAssignment[] = [
  { vendorId: 'mv-taj', tourId: 'op-aarav', tourCode: 'TF-WCC-10482', party: 'Aarav Shah · 2 adults' },
  { vendorId: 'mv-taj', tourId: 'op-isha', tourCode: 'TF-WCC-11018', party: 'Isha Menon · 2 adults' },
  { vendorId: 'mv-mmt', tourId: 'op-aarav', tourCode: 'TF-WCC-10482', party: 'Aarav Shah · 2 adults' },
  { vendorId: 'mv-mmt', tourId: 'op-isha', tourCode: 'TF-WCC-11018', party: 'Isha Menon · 2 adults' },
  { vendorId: 'mv-kayak', tourId: 'op-aarav', tourCode: 'TF-WCC-10482', party: 'Aarav Shah · 2 adults' },
  { vendorId: 'mv-wharf', tourId: 'op-isha', tourCode: 'TF-WCC-11018', party: 'Isha Menon · 2 adults' },
]

function assignmentKey(row: VendorAssignment) {
  return `${row.vendorId}:${row.tourId}`
}

export function loadAssignments(): VendorAssignment[] {
  const raw = localStorage.getItem(ASSIGN_KEY)
  if (!raw) return seedAssignments
  try {
    const extra = JSON.parse(raw) as VendorAssignment[]
    const seeded = new Set(seedAssignments.map(assignmentKey))
    return [...seedAssignments, ...extra.filter((row) => !seeded.has(assignmentKey(row)))]
  } catch {
    return seedAssignments
  }
}

export function persistAssignments(rows: VendorAssignment[]) {
  const seeded = new Set(seedAssignments.map(assignmentKey))
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(rows.filter((row) => !seeded.has(assignmentKey(row)))))
}

export function matchAarav(vendors: MarketVendor[]): MatchScore[] {
  const scored: MatchScore[] = [
    {
      vendorId: 'mv-taj',
      preference: 92,
      budget: 95,
      location: 89,
      availability: 'Confirmed',
      reason: 'Matches premium preference, beach proximity, and current budget.',
    },
    {
      vendorId: 'mv-novotel',
      preference: 90,
      budget: 95,
      location: 94,
      availability: 'Waitlist',
      reason: 'Inside the ₹15,000 stay band and 12 minutes from Fort Aguada, but inventory is waitlisted.',
    },
    {
      vendorId: 'mv-wharf',
      preference: 94,
      budget: 97,
      location: 86,
      availability: 'Confirmed',
      reason: 'Food-first match with a confirmed riverside table that still leaves buffer for adventure.',
    },
    {
      vendorId: 'mv-mmt',
      preference: 78,
      budget: 96,
      location: 91,
      availability: 'Confirmed',
      reason: 'Confirmed statewide cabs keep beach and adventure hops inside the ₹65,000 envelope.',
    },
    {
      vendorId: 'mv-kayak',
      preference: 91,
      budget: 96,
      location: 88,
      availability: 'Confirmed',
      reason: 'Adventure + beach without breaking the Day 4 budget if Baga swell holds.',
    },
    {
      vendorId: 'mv-baga',
      preference: 88,
      budget: 93,
      location: 96,
      availability: 'Limited',
      reason: 'Closest adventure-on-sand node. Availability is limited under the swell watch.',
    },
  ]
  return scored.filter((row) => vendors.some((vendor) => vendor.id === row.vendorId))
}
