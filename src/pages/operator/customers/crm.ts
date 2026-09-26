import { demoCustomers, travelerAarav } from '@/data/demo'

export interface CrmTrip {
  name: string
  dates: string
  spend: number
  status: string
}

export interface CrmBooking {
  item: string
  date: string
  amount: number
  status: string
}

export interface CrmProfile {
  id: string
  name: string
  email: string
  phone: string
  city: string
  home: string
  initials: string
  trips: number
  lastTrip: string
  preferences: string
  styles: string[]
  stay: string
  spend: number
  status: 'active' | 'planning' | 'dormant'
  pastTrips: CrmTrip[]
  bookings: CrmBooking[]
  favorites: string[]
  budgetPattern: string
  aiSummary: string
}

const extra: CrmProfile[] = [
  {
    id: 'trav-neha',
    name: 'Neha Bansal',
    email: 'neha.bansal@gmail.com',
    phone: '+91 98111 44022',
    city: 'Delhi',
    home: 'New Delhi, India',
    initials: 'NB',
    trips: 2,
    lastTrip: 'Pink City Week · Oct 2026',
    preferences: 'Culture · Heritage stays',
    styles: ['Culture', 'Photography'],
    stay: 'Heritage haveli',
    spend: 68400,
    status: 'active',
    pastTrips: [
      { name: 'Pink City Week', dates: '12–16 Oct 2026', spend: 27400, status: 'ongoing' },
      { name: 'Agra weekend', dates: '04–06 Mar 2026', spend: 41000, status: 'completed' },
    ],
    bookings: [{ item: 'Rambagh Palace night', date: '12 Oct 2026', amount: 18600, status: 'confirmed' }],
    favorites: ['Jaipur', 'Agra', 'Udaipur'],
    budgetPattern: 'Usually finishes 6–8% under a ₹40–70k brief.',
    aiSummary: 'Heritage-first traveler. Books havelis early and rarely adds last-minute adventure nodes.',
  },
  {
    id: 'trav-dev',
    name: 'Dev Kapoor',
    email: 'dev.kapoor@outlook.com',
    phone: '+91 98200 11880',
    city: 'Ahmedabad',
    home: 'Ahmedabad, India',
    initials: 'DK',
    trips: 1,
    lastTrip: 'Island City FIT · Oct 2026',
    preferences: 'City nights · Food',
    styles: ['Food', 'Nightlife'],
    stay: 'Airport-road 4-star',
    spend: 22100,
    status: 'active',
    pastTrips: [{ name: 'Island City FIT', dates: '14–17 Oct 2026', spend: 22100, status: 'ongoing' }],
    bookings: [{ item: 'Fern Andheri · 2 nights', date: '14 Oct 2026', amount: 15200, status: 'confirmed' }],
    favorites: ['Mumbai', 'Goa'],
    budgetPattern: 'Short FITs. Spends hardest on one signature meal.',
    aiSummary: 'Short-break city traveler. Keeps hotels near the next hop and spends on one reserved dinner.',
  },
]

export function crmProfiles(): CrmProfile[] {
  const fromDemo = demoCustomers.map((person) => profileFromDemo(person.id))
  return [...fromDemo, ...extra]
}

function profileFromDemo(id: string): CrmProfile {
  const person = demoCustomers.find((item) => item.id === id) ?? travelerAarav
  if (person.id === 'trav-aarav') {
    return {
      id: person.id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      city: person.city,
      home: person.home,
      initials: person.avatarInitials,
      trips: 2,
      lastTrip: 'West Coast Circuit · Oct 2026',
      preferences: 'Food · Culture · Premium stay',
      styles: person.travelStyle,
      stay: person.preferredStay,
      spend: 82250,
      status: 'active',
      pastTrips: [
        { name: 'West Coast Circuit', dates: '15–21 Oct 2026', spend: 55800, status: 'ongoing' },
        { name: 'Rann of Kutch', dates: '10–13 Jan 2026', spend: 26450, status: 'completed' },
      ],
      bookings: [
        { item: 'Vande Bharat 22925', date: '15 Oct 2026', amount: 4280, status: 'confirmed' },
        { item: 'Novotel Candolim', date: '17 Oct 2026', amount: 18800, status: 'waitlisted' },
        { item: 'Baga water sports', date: '18 Oct 2026', amount: 3600, status: 'pending' },
      ],
      favorites: ['Goa', 'Kutch', 'Mumbai'],
      budgetPattern: 'Tends to stay within 10% of a ₹65k circuit budget.',
      aiSummary:
        'Traveler prefers food + culture experiences, usually chooses premium accommodation and tends to stay within 10% of budget.',
    }
  }
  if (person.id === 'trav-isha') {
    return {
      id: person.id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      city: person.city,
      home: person.home,
      initials: person.avatarInitials,
      trips: 2,
      lastTrip: 'West Coast Circuit · Nov 2026',
      preferences: 'Culture · Food · Boutique',
      styles: person.travelStyle,
      stay: person.preferredStay,
      spend: 9800,
      status: 'planning',
      pastTrips: [
        { name: 'West Coast Circuit', dates: '18–22 Nov 2026', spend: 9800, status: 'booked' },
        { name: 'Lakes & Palaces', dates: '24–27 Dec 2026', spend: 0, status: 'planning' },
      ],
      bookings: [{ item: 'BLR–GOI hold', date: '18 Nov 2026', amount: 9800, status: 'confirmed' }],
      favorites: ['Goa', 'Udaipur', 'Bengaluru'],
      budgetPattern: 'Books air first, then shops boutique stays inside a ₹45–55k band.',
      aiSummary: 'Culture-and-food traveler who prefers boutique hotels and will not rush a temple or cafe morning.',
    }
  }
  if (person.id === 'trav-kabir') {
    return {
      id: person.id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      city: person.city,
      home: person.home,
      initials: person.avatarInitials,
      trips: 1,
      lastTrip: 'Spiti Shoulder · Oct 2026',
      preferences: 'Adventure · Photography',
      styles: person.travelStyle,
      stay: person.preferredStay,
      spend: 68800,
      status: 'active',
      pastTrips: [{ name: 'Spiti Shoulder', dates: '03–10 Oct 2026', spend: 68800, status: 'ongoing' }],
      bookings: [{ item: 'Manali–Kaza jeeps', date: '03 Oct 2026', amount: 18400, status: 'confirmed' }],
      favorites: ['Spiti', 'Manali', 'Ladakh'],
      budgetPattern: 'Pays for access and light. Sleeps in 4-star if the sunrise is worth it.',
      aiSummary: 'Adventure photographer. Will stretch budget for a clear ridge and skip nightlife entirely.',
    }
  }
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    phone: person.phone,
    city: person.city,
    home: person.home,
    initials: person.avatarInitials,
    trips: 1,
    lastTrip: 'South Goa Slow · Nov 2026',
    preferences: 'Relaxation · Food · Wellness',
    styles: person.travelStyle,
    stay: person.preferredStay,
    spend: 0,
    status: 'planning',
    pastTrips: [{ name: 'South Goa Slow', dates: '08–12 Nov 2026', spend: 0, status: 'planning' }],
    bookings: [],
    favorites: ['Palolem', 'Kerala', 'Udaipur'],
    budgetPattern: 'Resort-led briefs around ₹35–40k. Rarely books dawn starts.',
    aiSummary: 'Slow traveler. Wants a resort base, one great meal a day, and no packed mornings.',
  }
}
