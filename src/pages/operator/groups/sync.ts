export type PrefKey = 'Adventure' | 'Food' | 'Beach' | 'Culture' | 'Nightlife' | 'Relaxation'
export type VoteKind = 'accept' | 'change' | null

export const prefKeys: PrefKey[] = ['Adventure', 'Food', 'Beach', 'Culture', 'Nightlife', 'Relaxation']

export interface GroupMember {
  id: string
  name: string
  initials: string
  brief: string
  scores: Record<PrefKey, 0 | 1 | 2>
}

export interface GroupDay {
  day: number
  title: string
  city: string
  time: string
  body: string
  serves: PrefKey[]
}

export interface GroupConflict {
  title: string
  left: string
  right: string
  suggestion: string
}

export interface SyncGroup {
  id: string
  name: string
  dates: string
  city: string
  pax: number
  lead: string
  status: 'syncing' | 'forming' | 'locked'
  submitted: number
  members: GroupMember[]
  clusters: { key: PrefKey; count: number }[]
  blend: string
  conflict: GroupConflict
  days: GroupDay[]
}

export interface MemberVote {
  vote: VoteKind
  note?: string
}

const VOTE_KEY = 'tf-ops-group-votes'

export const goaFriends: SyncGroup = {
  id: 'grp-goa-friends',
  name: 'Goa Friends Trip',
  dates: '18–22 Nov 2026',
  city: 'Goa',
  pax: 5,
  lead: 'Aarav Shah',
  status: 'syncing',
  submitted: 5,
  members: [
    {
      id: 'm-aarav',
      name: 'Aarav',
      initials: 'AS',
      brief: 'Adventure + Food',
      scores: { Adventure: 2, Food: 2, Beach: 1, Culture: 0, Nightlife: 0, Relaxation: 0 },
    },
    {
      id: 'm-neha',
      name: 'Neha',
      initials: 'NB',
      brief: 'Relaxation + Beach',
      scores: { Adventure: 0, Food: 0, Beach: 2, Culture: 0, Nightlife: 0, Relaxation: 2 },
    },
    {
      id: 'm-rohan',
      name: 'Rohan',
      initials: 'RM',
      brief: 'Nightlife + Food',
      scores: { Adventure: 0, Food: 2, Beach: 0, Culture: 0, Nightlife: 2, Relaxation: 0 },
    },
    {
      id: 'm-meera',
      name: 'Meera',
      initials: 'MI',
      brief: 'Culture + Photography',
      scores: { Adventure: 1, Food: 0, Beach: 0, Culture: 2, Nightlife: 0, Relaxation: 1 },
    },
    {
      id: 'm-kabir',
      name: 'Kabir',
      initials: 'KM',
      brief: 'Adventure + Beach',
      scores: { Adventure: 2, Food: 0, Beach: 2, Culture: 0, Nightlife: 1, Relaxation: 0 },
    },
  ],
  clusters: [
    { key: 'Adventure', count: 3 },
    { key: 'Food', count: 2 },
    { key: 'Beach', count: 3 },
  ],
  blend: 'Keep mornings on water and sand, put one serious kitchen in the middle of the week, and hold Fontainhas for Meera’s camera. Nightlife is isolated — not the default evening.',
  conflict: {
    title: 'Nightlife vs Relaxation',
    left: '3 prefer earlier evenings',
    right: '2 prefer nightlife',
    suggestion: 'Schedule nightlife on Day 4 and keep Days 2–3 relaxed.',
  },
  days: [
    {
      day: 1,
      title: 'Candolim settle-in',
      city: 'Candolim',
      time: '14:00',
      body: 'Check-in, beach hour, early seafood. Soft landing for the relaxation cluster.',
      serves: ['Beach', 'Relaxation', 'Food'],
    },
    {
      day: 2,
      title: 'Fontainhas + slow coast',
      city: 'Panaji',
      time: '09:30',
      body: 'Photography walk in Latin Quarter, then a quiet afternoon at the suite. No late plan.',
      serves: ['Culture', 'Relaxation'],
    },
    {
      day: 3,
      title: 'Kayak and catch lunch',
      city: 'Chapora',
      time: '08:30',
      body: 'Mangrove kayak for Aarav and Kabir, table at Fisherman’s Wharf after. Back by 19:00.',
      serves: ['Adventure', 'Food', 'Beach'],
    },
    {
      day: 4,
      title: 'Baga night — one evening only',
      city: 'Baga',
      time: '16:00',
      body: 'Late start, beach sports, then nightlife for Rohan and Kabir. Others can peel off after dinner.',
      serves: ['Nightlife', 'Adventure', 'Food'],
    },
    {
      day: 5,
      title: 'Old Goa, then buffers',
      city: 'Old Goa',
      time: '09:00',
      body: 'Basilica hour for Meera, coconut water on the lawn, airport-ready by 14:00.',
      serves: ['Culture', 'Relaxation'],
    },
  ],
}

export const otherGroups: SyncGroup[] = [
  {
    ...goaFriends,
    id: 'g1',
    name: 'Horizon Trails · West Coast 15 Oct',
    dates: '15–21 Oct 2026',
    city: 'Ahmedabad',
    pax: 14,
    lead: 'Aarav Shah + 13',
    status: 'locked',
    submitted: 14,
    members: goaFriends.members,
  },
  {
    ...goaFriends,
    id: 'g2',
    name: 'Bengaluru Food Club · Goa',
    dates: '18–22 Nov 2026',
    city: 'Bengaluru',
    pax: 8,
    lead: 'Isha Menon',
    status: 'forming',
    submitted: 3,
    members: goaFriends.members.slice(0, 3),
    clusters: [],
    days: [],
  },
]

export const syncGroups: SyncGroup[] = [goaFriends, ...otherGroups]

export function loadGroup(id: string) {
  return syncGroups.find((group) => group.id === id) ?? null
}

export function loadVotes(groupId: string): Record<string, MemberVote> {
  const raw = localStorage.getItem(VOTE_KEY)
  if (!raw) return {}
  try {
    const all = JSON.parse(raw) as Record<string, Record<string, MemberVote>>
    return all[groupId] ?? {}
  } catch {
    return {}
  }
}

export function persistVote(groupId: string, memberId: string, vote: MemberVote) {
  const raw = localStorage.getItem(VOTE_KEY)
  const all = raw ? (JSON.parse(raw) as Record<string, Record<string, MemberVote>>) : {}
  all[groupId] = { ...all[groupId], [memberId]: vote }
  localStorage.setItem(VOTE_KEY, JSON.stringify(all))
}
