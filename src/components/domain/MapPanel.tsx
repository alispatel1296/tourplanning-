import { TripMap } from '@/components/domain/TripMap'
import { useTripGeo } from '@/hooks/useTripGeo'
import type { TripNode } from '@/types'

const CORRIDOR: TripNode[] = [
  {
    id: 'map-amd',
    day: 1,
    date: '2026-10-15',
    title: 'Ahmedabad',
    city: 'Ahmedabad',
    time: '08:00',
    category: 'transport',
    status: 'upcoming',
    cost: 0,
    notes: 'Origin',
  },
  {
    id: 'map-bom',
    day: 1,
    date: '2026-10-15',
    title: 'Mumbai',
    city: 'Mumbai',
    time: '14:00',
    category: 'stay',
    status: 'upcoming',
    cost: 0,
    notes: 'Mid stop',
  },
  {
    id: 'map-goa',
    day: 3,
    date: '2026-10-17',
    title: 'Goa',
    city: 'Goa',
    time: '18:00',
    category: 'activity',
    status: 'upcoming',
    cost: 0,
    notes: 'Coast',
  },
]

export function MapPanel({
  title = 'Live route',
  caption = 'Ahmedabad → Mumbai → Goa',
  nodes,
  selectedId,
  onSelect,
  height = 260,
}: {
  title?: string
  caption?: string
  nodes?: TripNode[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  height?: number
}) {
  const { located, routes, loading, error, retry } = useTripGeo(nodes ?? CORRIDOR)
  return (
    <TripMap
      title={title}
      caption={caption}
      nodes={located}
      routes={routes}
      selectedId={selectedId}
      onSelect={onSelect}
      height={height}
      loading={loading}
      error={error}
      onRetry={retry}
      searchEnabled
    />
  )
}
