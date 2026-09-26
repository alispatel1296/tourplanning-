import type { Role } from '@/types'

export type NoticeCategory = 'Trip' | 'Booking' | 'Weather' | 'Transport' | 'AI' | 'Payment' | 'Coordinator'
export type DecisionStatus = 'pending' | 'accepted' | 'rejected'
export type EngineId =
  | 'recommendation'
  | 'feasibility'
  | 'reroute'
  | 'budget'
  | 'voice'
  | 'notification'

export const noticeCategories: NoticeCategory[] = [
  'Trip',
  'Booking',
  'Weather',
  'Transport',
  'AI',
  'Payment',
  'Coordinator',
]

export interface AiDecision {
  change: string
  why: string
  impact: string
  status: DecisionStatus
}

export interface InboxNotice {
  id: string
  audience: 'traveler' | 'operator' | 'both'
  category: NoticeCategory
  title: string
  body: string
  affected?: string
  time: string
  critical?: boolean
  read: boolean
  aiRecommendation?: boolean
  reviewTo: { traveler: string; operator: string }
  decision?: AiDecision
}

export interface EnginePulse {
  id: EngineId
  name: string
  state: string
  live: boolean
}

export interface ActivityBeat {
  time: string
  body: string
  engine: EngineId
}

const STORE = 'tf-intel-inbox'

export const seedNotices: InboxNotice[] = [
  {
    id: 'in-weather',
    audience: 'both',
    category: 'Weather',
    title: 'Weather Alert',
    body: 'Heavy rain expected near Baga Beach tomorrow.',
    affected: 'Day 5 Beach Activity',
    time: '12:43',
    critical: true,
    read: false,
    aiRecommendation: true,
    reviewTo: { traveler: '/traveler/live/trip-amd-goa', operator: '/operator/conflicts' },
    decision: {
      change: 'Beach activity → Cooking class',
      why: 'Rain risk exceeded threshold.',
      impact: '₹400 additional cost',
      status: 'pending',
    },
  },
  {
    id: 'in-booking',
    audience: 'both',
    category: 'Booking',
    title: 'Stay hold still yellow',
    body: 'Novotel Candolim is waitlisted. Taj garden-view remains confirmed.',
    affected: 'Day 3–6 stay',
    time: '11:20',
    read: false,
    aiRecommendation: true,
    reviewTo: { traveler: '/traveler/itinerary', operator: '/operator/bookings' },
    decision: {
      change: 'Novotel waitlist → Taj garden-view lock',
      why: 'Allotment risk crossed 60% on the MICE hold.',
      impact: '₹2,400 above the Novotel band · stay confirmed',
      status: 'pending',
    },
  },
  {
    id: 'in-trip',
    audience: 'traveler',
    category: 'Trip',
    title: 'West Coast Circuit is live',
    body: 'You are on Day 4. The green path is the current itinerary.',
    time: '08:10',
    read: false,
    reviewTo: { traveler: '/traveler/live/trip-amd-goa', operator: '/operator/tours/op-aarav' },
  },
  {
    id: 'in-pay',
    audience: 'traveler',
    category: 'Payment',
    title: 'Payment captured',
    body: '₹63,000 received against TF-2026-10482.',
    time: 'Yesterday',
    read: true,
    reviewTo: { traveler: '/traveler/checkout', operator: '/operator/bookings/TF-2026-10482' },
  },
  {
    id: 'in-transport',
    audience: 'traveler',
    category: 'Transport',
    title: 'BOM–GOI hop confirmed',
    body: 'IndiGo 6E 5121 is held for 17 Oct. Cabin bag only.',
    time: 'Yesterday',
    read: true,
    reviewTo: { traveler: '/traveler/prep', operator: '/operator/bookings' },
  },
  {
    id: 'in-coord-t',
    audience: 'traveler',
    category: 'Coordinator',
    title: 'Rohan Desai is on duty',
    body: 'Your field desk is in Panaji until 18:00. SOS still reaches him first.',
    time: 'Yesterday',
    read: true,
    reviewTo: { traveler: '/traveler/live/trip-amd-goa', operator: '/operator/coordinators' },
  },
  {
    id: 'in-ai-photo',
    audience: 'traveler',
    category: 'AI',
    title: 'Photography window moved',
    body: 'Fontainhas is scored better at 08:40 than the Old Goa noon slot.',
    affected: 'Day 2 morning',
    time: '2 days ago',
    read: true,
    aiRecommendation: true,
    reviewTo: { traveler: '/traveler/itinerary', operator: '/operator/tours/op-aarav' },
    decision: {
      change: 'Old Goa noon → Fontainhas 08:40',
      why: 'Shade and empty lanes beat the basilica crowd.',
      impact: '₹0 · same day, earlier start',
      status: 'accepted',
    },
  },
  {
    id: 'in-op-group',
    audience: 'operator',
    category: 'Payment',
    title: 'Group split still open',
    body: 'Goa Friends Circuit is 4/5 paid. Rohan ₹12,000 is pending.',
    time: '10:05',
    read: false,
    reviewTo: { traveler: '/traveler/checkout', operator: '/operator/bookings/TF-2026-11090' },
  },
  {
    id: 'in-op-coord',
    audience: 'operator',
    category: 'Coordinator',
    title: 'Riya Patel owns TF-2026-10482',
    body: 'Assignment confirmed with traveler, vendor, and emergency duties.',
    time: '09:40',
    read: false,
    reviewTo: { traveler: '/traveler', operator: '/operator/coordinators' },
  },
  {
    id: 'in-op-ai',
    audience: 'operator',
    category: 'AI',
    title: 'Consensus plan is waiting on votes',
    body: 'Goa Friends Trip has three clusters. Nightlife vs relaxation is still open.',
    time: '09:12',
    read: true,
    aiRecommendation: true,
    reviewTo: { traveler: '/traveler', operator: '/operator/groups/grp-goa-friends' },
    decision: {
      change: 'Nightlife every night → nightlife on Day 4 only',
      why: 'Three members filed earlier evenings. Two filed nightlife.',
      impact: 'No extra cost · Days 2–3 stay quiet',
      status: 'pending',
    },
  },
  {
    id: 'in-op-trip',
    audience: 'operator',
    category: 'Trip',
    title: 'Aarav Shah is on Day 4',
    body: 'West Coast Circuit is live. Baga swell is the open field risk.',
    time: '08:10',
    read: true,
    reviewTo: { traveler: '/traveler/live/trip-amd-goa', operator: '/operator/tours/op-aarav' },
  },
]

export const engines: EnginePulse[] = [
  { id: 'recommendation', name: 'Recommendation Engine', state: 'Alternative staged', live: true },
  { id: 'feasibility', name: 'Feasibility Engine', state: '24 nodes checked', live: true },
  { id: 'reroute', name: 'Dynamic Rerouting', state: 'Conflict on Day 5', live: true },
  { id: 'budget', name: 'Budget Engine', state: '₹400 delta priced', live: true },
  { id: 'voice', name: 'Voice Assistant', state: 'Standby · Rohan desk', live: false },
  { id: 'notification', name: 'Notification Engine', state: 'Weather alert sent', live: true },
]

export const activityBeats: ActivityBeat[] = [
  { time: '12:41', body: 'AI checked 24 itinerary nodes', engine: 'feasibility' },
  { time: '12:43', body: 'Conflict detected', engine: 'reroute' },
  { time: '12:44', body: 'Alternative found', engine: 'recommendation' },
  { time: '12:45', body: 'Budget recalculated', engine: 'budget' },
]

export function noticesFor(role: Extract<Role, 'traveler' | 'operator'>): InboxNotice[] {
  return loadInbox().filter((item) => item.audience === role || item.audience === 'both')
}

export function loadInbox(): InboxNotice[] {
  const raw = localStorage.getItem(STORE)
  if (!raw) return seedNotices
  try {
    const data = JSON.parse(raw) as Record<string, Partial<InboxNotice>> | InboxNotice[]
    if (Array.isArray(data)) return data
    return seedNotices.map((row) => {
      const next = data[row.id]
      if (!next) return row
      return {
        ...row,
        ...next,
        decision: next.decision ? ({ ...row.decision, ...next.decision } as AiDecision) : row.decision,
      }
    })
  } catch {
    return seedNotices
  }
}

function persist(id: string, patch: Partial<InboxNotice>) {
  const raw = localStorage.getItem(STORE)
  const current = raw ? (JSON.parse(raw) as Record<string, Partial<InboxNotice>>) : {}
  const prev = current[id] ?? {}
  current[id] = {
    ...prev,
    ...patch,
    decision: patch.decision ?? prev.decision,
  }
  localStorage.setItem(STORE, JSON.stringify(current))
  window.dispatchEvent(new Event('tf-inbox'))
}

export function markRead(id: string) {
  persist(id, { read: true })
}

export function markAllRead(role: Extract<Role, 'traveler' | 'operator'>) {
  noticesFor(role).forEach((item) => persist(item.id, { read: true }))
}

export function decideNotice(id: string, status: Exclude<DecisionStatus, 'pending'>) {
  const row = loadInbox().find((item) => item.id === id)
  if (!row?.decision) return
  persist(id, { read: true, decision: { ...row.decision, status } })
}

export function addSimulatedNotice(role: Extract<Role, 'traveler' | 'operator'> = 'traveler'): InboxNotice {
  const id = `sim-${Date.now()}`
  const notice: InboxNotice = {
    id,
    audience: role,
    category: 'Weather',
    title: 'Live Rain Warning & AI Reroute',
    body: 'Heavy rainfall forecasted near day-3 coastal leg. AI recommends switching to an indoor spice plantation masterclass.',
    affected: 'Day 3 Coastal Circuit',
    time: 'Just now',
    critical: true,
    read: false,
    aiRecommendation: true,
    reviewTo: { traveler: '/traveler/live/trip-amd-goa', operator: '/operator/conflicts' },
    decision: {
      change: 'Coastal Beach Hop → Tropical Spice Plantation Masterclass',
      why: '85% precipitation probability exceeding safety threshold.',
      impact: '₹350 price drop · Full refund difference applied',
      status: 'pending',
    },
  }
  persist(id, notice)
  return notice
}

export function unreadCount(role: Extract<Role, 'traveler' | 'operator'>): number {
  return noticesFor(role).filter((item) => !item.read).length
}

export function resetDemoInbox() {
  localStorage.removeItem(STORE)
  window.dispatchEvent(new Event('tf-inbox'))
}

