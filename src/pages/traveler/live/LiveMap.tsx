import { TripMap } from '@/components/domain/TripMap'
import { useTripGeo } from '@/hooks/useTripGeo'
import type { UserFix } from '@/services/location/location'
import type { TripNode } from '@/types'

export function LiveMap({
  nodes,
  current,
  next,
  selectedId,
  userLocation,
  onSelect,
}: {
  nodes: TripNode[]
  current: TripNode | null
  next: TripNode | null
  selectedId?: string | null
  userLocation?: UserFix | null
  onSelect?: (id: string) => void
}) {
  const { located, routes, loading, error, retry } = useTripGeo(nodes)
  const cities = [...new Set(nodes.filter((node) => node.status !== 'alternative').map((node) => node.city).filter(Boolean))]
  const caption = cities.length
    ? cities.join(' → ')
    : current
      ? `${current.city}${next ? ` → ${next.city}` : ''}`
      : 'Waiting for a live fix'
  return (
    <TripMap
      title="Live map"
      caption={caption}
      nodes={located}
      routes={routes}
      selectedId={selectedId ?? current?.id}
      userLocation={userLocation}
      onSelect={onSelect}
      height={380}
      loading={loading}
      error={error}
      onRetry={retry}
    />
  )
}
