export const MAP_COLORS = {
  route: '#10b981',
  alternative: '#f59e0b',
  disrupted: '#e11d48',
  transport: '#2563eb',
  here: '#2563eb',
  ai: '#7c3aed',
  stay: '#7c3aed',
  food: '#d97706',
  activity: '#059669',
  selected: '#047857',
} as const

export type MarkerKind = 'stay' | 'food' | 'activity' | 'transport' | 'free' | 'here' | 'ai' | 'disrupted'

export function markerColor(kind: MarkerKind): string {
  if (kind === 'disrupted') return MAP_COLORS.disrupted
  if (kind === 'here') return MAP_COLORS.here
  if (kind === 'ai') return MAP_COLORS.ai
  if (kind === 'transport') return MAP_COLORS.transport
  if (kind === 'stay') return MAP_COLORS.stay
  if (kind === 'food') return MAP_COLORS.food
  if (kind === 'activity' || kind === 'free') return MAP_COLORS.activity
  return MAP_COLORS.route
}
