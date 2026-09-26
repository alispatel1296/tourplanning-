import type { Trip } from '@/types'

export type ReviewKind = 'hotel' | 'transport' | 'restaurant' | 'activity'

export interface VendorReview {
  id: ReviewKind
  label: string
  vendor: string
  rating: number
  comment: string
  photos: string[]
  source: 'empty' | 'ai' | 'edited'
  approved: boolean
  drafting: boolean
}

export const REVIEW_KEY = (tripId: string) => `tf-reviews-${tripId}`

function buildDrafts(trip: Trip): Record<ReviewKind, string> {
  const transportNode = trip.nodes.find((n) => n.category === 'transport')
  const stayNode = trip.nodes.find((n) => n.category === 'stay')
  const foodNode = trip.nodes.find((n) => n.category === 'food')
  const activityNode = trip.nodes.find((n) => n.category === 'activity')
  const originName = trip.route.split('→')[0]?.trim() ?? 'origin'
  const destName = trip.route.split('→').pop()?.trim() ?? 'the destination'
  return {
    hotel: `Great stay at ${stayNode?.title ?? 'the hotel'} – convenient location and friendly staff. The room was comfortable and made it easy to explore ${destName} each evening.`,
    transport: `${transportNode?.title ?? 'The journey'} was smooth and on time. The trip from ${originName} to ${destName} was well-organized with no significant delays.`,
    restaurant: `${foodNode?.title ?? 'The local food scene'} in ${destName} was a highlight – authentic flavors and great value. Would definitely revisit on the next trip.`,
    activity: `${activityNode?.title ?? 'The activities'} in ${destName} were the trip's high points. Well worth the time and perfectly matched the itinerary pace.`,
  }
}

export function vendorFor(trip: Trip, kind: ReviewKind) {
  const nodes = trip.nodes
  if (kind === 'hotel') {
    return [...nodes].reverse().find((node) => node.category === 'stay')?.title ?? 'Hotel stay'
  }
  if (kind === 'transport') return nodes.find((node) => node.category === 'transport')?.title ?? 'Circuit transfers'
  if (kind === 'restaurant') {
    return nodes.find((node) => node.category === 'food' && node.cost >= 1600)?.title ?? nodes.find((node) => node.category === 'food')?.title ?? 'Local thali'
  }
  return (
    nodes.find((node) => node.category === 'activity' && node.cost > 0)?.title ??
    nodes.find((node) => node.category === 'activity')?.title ??
    'Guided experiences'
  )
}

export function emptyReviews(trip: Trip): VendorReview[] {
  return [
    { id: 'hotel', label: 'Hotel', vendor: vendorFor(trip, 'hotel'), rating: 0, comment: '', photos: [], source: 'empty', approved: false, drafting: false },
    { id: 'transport', label: 'Transport', vendor: vendorFor(trip, 'transport'), rating: 0, comment: '', photos: [], source: 'empty', approved: false, drafting: false },
    { id: 'restaurant', label: 'Restaurant', vendor: vendorFor(trip, 'restaurant'), rating: 0, comment: '', photos: [], source: 'empty', approved: false, drafting: false },
    { id: 'activity', label: 'Activity', vendor: vendorFor(trip, 'activity'), rating: 0, comment: '', photos: [], source: 'empty', approved: false, drafting: false },
  ]
}

export function aiDraft(kind: ReviewKind, trip?: Trip): string {
  if (trip) {
    return buildDrafts(trip)[kind]
  }
  // Fallback generic drafts when no trip context is available
  const fallback: Record<ReviewKind, string> = {
    hotel: 'Great stay with a convenient location and friendly staff. The room was comfortable and made it easy to reach our evening activities.',
    transport: 'The journey was smooth and on time, with good connectivity throughout the trip.',
    restaurant: 'The local food was delicious – authentic flavors and great value for money.',
    activity: 'The activities were the trip\'s high points. Well worth the time and perfectly matched the itinerary pace.',
  }
  return fallback[kind]
}

export function tripInsights(trip: Trip) {
  const activities = trip.nodes.filter((node) => node.category === 'activity' || node.category === 'food').length
  const done = trip.nodes.filter((node) => node.status === 'visited').length
  const totalCost = trip.nodes
    .filter((n) => n.status !== 'alternative')
    .reduce((sum, n) => sum + n.cost, 0)
  const saved = Math.max(0, trip.budget - totalCost)
  const savedStr = saved > 0
    ? `₹${saved.toLocaleString('en-IN')}`
    : '₹0'
  const adaptations = trip.nodes.filter((n) => n.status === 'alternative').length > 0 ? '1' : '0'
  return [
    { label: 'Saved', value: savedStr },
    { label: 'Itinerary adaptation', value: adaptations },
    { label: 'Activities completed', value: String(activities || 0) },
    { label: 'Planned nodes', value: trip.nodes.length ? `${done}/${trip.nodes.length}` : '0/0' },
  ]
}

export function loadReviewState(tripId: string) {
  const raw = localStorage.getItem(REVIEW_KEY(tripId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as { submitted: boolean; reviews: VendorReview[] }
  } catch {
    return null
  }
}

export function persistReviewState(tripId: string, submitted: boolean, reviews: VendorReview[]) {
  const safe = reviews.map((review) => ({ ...review, photos: [], drafting: false }))
  localStorage.setItem(REVIEW_KEY(tripId), JSON.stringify({ submitted, reviews: safe }))
}
