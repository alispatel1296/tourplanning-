import { useMemo } from 'react'
import { MapPanel } from '@/components/domain/MapPanel'
import { routeCities } from '@/lib/plan'
import type { TripPlan } from '@/types/plan'
import type { TripNode } from '@/types'

export function RoutePreview({ plan }: { plan: TripPlan }) {
  const route = routeCities(plan)

  const nodes: TripNode[] = useMemo(() => {
    return route.map((city, index) => ({
      id: `route-preview-node-${city}-${index}`,
      day: index + 1,
      date: plan.startDate,
      title: city,
      city: city,
      time: index === 0 ? '08:00' : '14:00',
      category: index === 0 ? 'transport' : index === route.length - 1 ? 'activity' : 'stay',
      status: 'upcoming',
      cost: 0,
      notes: index === 0 ? 'Start (Home)' : `Stop ${index}`,
    }))
  }, [route, plan.startDate])

  return (
    <div className="sticky top-20">
      <MapPanel
        title="Interactive route map"
        caption={route.join(' → ') || 'Add a city to preview'}
        nodes={nodes}
        height={340}
      />
    </div>
  )
}
